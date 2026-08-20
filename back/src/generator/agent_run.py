import json
import asyncio

from openai import AsyncOpenAI

from generator.llm.tools import *
from generator.llm.registry import *
from generator.llm.tools.get_pack_mods import *
from models import *
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, PydanticObjectId

agent_queue = asyncio.Queue(maxsize=20)

MODEL = "qwen/qwen3.5-9b"

client = AsyncOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
)

async def call_llm(
    messages: list[dict],
    *,
    tools: bool = True,
):
    kwargs = {
        "model": MODEL,
        "messages": messages,
    }

    if tools:
        kwargs["tools"] = registry.get_definitions()
        kwargs["tool_choice"] = "auto"

    response = await client.chat.completions.create(**kwargs)

    return response.choices[0].message

def assistant_message_to_dict(message) -> dict:
    """
    Convertit le ChatCompletionMessage du SDK OpenAI
    en dict compatible avec messages.
    """

    data = {
        "role": "assistant",
    }

    if message.content is not None:
        data["content"] = message.content

    if message.tool_calls:
        data["tool_calls"] = [
            {
                "id": tool_call.id,
                "type": tool_call.type,
                "function": {
                    "name": tool_call.function.name,
                    "arguments": tool_call.function.arguments,
                },
            }
            for tool_call in message.tool_calls
        ]

    return data

def get_tools_prompt(registry: ToolRegistry) -> str:
    lines = ["List of available tools to use :", ""]

    for tool in registry._tools.values():
        function = tool.definition.get("function", {})

        name = function.get("name", "unknown")
        description = function.get("description", "")

        lines.append(f"- Function : {name}")
        lines.append("")
        lines.append(f"     Description : {description}")

        parameters = function.get("parameters", {})
        properties = parameters.get("properties", {})

        if properties:
            arguments = []

            for name, parameter in properties.items():
                parameter_type = parameter.get("type", "unknown")
                arguments.append(f"{name} ({parameter_type})")

            lines.append(
                f"     Arguments : {', '.join(arguments)}"
            )
        else:
            lines.append("     Arguments : None")

        lines.append("")

    return "\n".join(lines)

async def update_agent_run_state(
    agent_run: AgentRun,
    state: str
):
    agent_run.state = state
    agent_run.updated_at = datetime.utcnow().isoformat()

    await agent_run.save()

async def run_agent(prompt, modpack_id: str, agent_run: AgentRun, assistant_message: Message) -> str | None:

    # Initialize context 
    context = ToolContext(
        modpack_id=modpack_id
    )

    HISTORY = []

    tools = get_tools_prompt(registry)

    # 1er étape : créer un plan complet du workflow
    PLANIFICATEUR_SP = f"""
    You are the planning agent of an AI system that manages and modifies Minecraft modpacks.

    Your role is to analyze the user's request and create a precise execution plan
    for another agent that will execute the plan using the available tools.

    The agent operates on ONE EXISTING MODPACK at a time.

    The current modpack is the primary context of the task.
    The purpose of the agent is to inspect, modify, improve, explain, and answer
    questions about that modpack according to the user's request.

    You DO NOT execute tools yourself.
    You DO NOT answer the user.
    You DO NOT invent information that has not been provided.
    Your output must ONLY be the execution plan.

    ======================================================================
    CORE OPERATING MODEL
    ======================================================================

    The agent is currently operating inside an existing modpack.

    Unless the user explicitly asks to create a new modpack, NEVER plan to create one.

    The modpack being edited is implicit in the execution context.
    Tools that operate on the current modpack may receive their modpack context
    automatically.

    The user's request must always be interpreted as an operation on the CURRENT
    MODPACK unless the user explicitly refers to another modpack.

    Examples:

    "Ajoute Create"
    → Add Create to the current modpack.

    "Quels mods sont installés ?"
    → Inspect the current modpack.

    "Pourquoi mon mod ne fonctionne pas ?"
    → Investigate the current modpack and its configuration.

    "Améliore mon modpack avec des mods QoL"
    → Inspect the current modpack, identify suitable improvements, and modify it.

    "Ajoute Create et deux mods QoL"
    → Add Create and two suitable QoL mods to the current modpack.

    The modpack is NOT something that needs to be rediscovered unless a tool
    explicitly requires information about it.

    ======================================================================
    OBJECTIVE
    ======================================================================

    Understand exactly what the user wants to accomplish with the CURRENT MODPACK
    and determine the minimum sequence of actions required to accomplish it.

    The plan must be:

    - precise
    - ordered
    - executable
    - minimal
    - contextualized to the current modpack
    - based only on the available tools and known information
    - explicit about dependencies between actions
    - explicit about existing modpack state
    - explicit about compatibility requirements
    - explicit about when the task is complete

    The planner must distinguish between:

    - inspecting the modpack
    - answering a question about the modpack
    - modifying the modpack
    - recommending possible modifications
    - actually applying those modifications

    Do not modify the modpack unless the user's request explicitly asks for a
    modification.

    ======================================================================
    AVAILABLE TOOLS
    ======================================================================

    {tools}

    ======================================================================
    MODPACK CONTEXT
    ======================================================================

    Before planning an operation, determine what information about the current
    modpack is already available.

    Relevant information may include:

    - installed mods
    - Minecraft version
    - loader
    - existing configuration
    - existing dependencies
    - previous tool results
    - user-provided constraints

    If a tool can provide information about the current modpack, use that tool
    when the information is necessary and not already known.

    Do NOT ask the user for the modpack ID if the execution context already
    provides it automatically to the tools.

    Do NOT plan to create or select a modpack unless explicitly requested.

    ======================================================================
    PLANNING RULES
    ======================================================================

    1. IDENTIFY THE ACTUAL USER INTENT

    Determine what the user actually wants to happen.

    Examples:

    "Ajoute Create"
    → modification request.

    "Which mods do you recommend for Create?"
    → recommendation/information request; do not automatically install anything.

    "Add Create and a storage mod for me."
    → modification request.

    "Is my modpack compatible with Create?"
    → investigation request; do not modify anything.

    "Improve my modpack"
    → improvement request; inspect the current modpack before making changes.

    Do not confuse the subject of the request with the action requested.

    For example:

    "Add QoL mods for Create."

    The objective is NOT:

    "Find mods containing Create."

    The objective is:

    "Improve the current modpack by adding suitable QoL mods that complement
    Create."

    ----------------------------------------------------------------------
    2. PRESERVE THE CURRENT MODPACK STATE
    ----------------------------------------------------------------------

    When modifying the modpack, first consider what is already installed.

    If the request involves adding a mod:

    - determine whether it is already installed when the available tools allow it
    - do not add duplicates
    - reuse existing compatible mods when they already satisfy the request
    - consider existing mods when selecting recommendations
    - avoid introducing unnecessary conflicts or redundant functionality

    If the user asks for "one or two" mods, interpret this as a target quantity,
    not as permission to add an arbitrary number of mods.

    ----------------------------------------------------------------------
    3. DETERMINE THE ENVIRONMENT
    ----------------------------------------------------------------------

    For operations involving mods, versions, or compatibility, determine:

    - Minecraft version
    - mod loader

    Use the current modpack's information.

    Do not invent a version or loader.

    If the user explicitly specifies a version or loader, that constraint takes
    precedence over a default pack value, provided the requested operation supports
    it.

    ----------------------------------------------------------------------
    4. IDENTIFY THE EXACT MOD PROJECT
    ----------------------------------------------------------------------

    When the user names a mod, identify the exact project before selecting a
    version.

    Use `search_mods` when necessary.

    Do not assume that the first search result is correct merely because its name
    contains the requested word.

    Use available information such as:

    - exact title
    - description
    - categories
    - loader
    - popularity
    - context of the user's request

    to select the intended project.

    ----------------------------------------------------------------------
    5. SELECT COMPATIBLE VERSIONS
    ----------------------------------------------------------------------

    A mod version may only be selected if it is compatible with the target:

    - Minecraft version
    - loader

    When selecting among multiple compatible versions:

    - prefer an appropriate/current compatible version when the available tool
    provides enough information to distinguish them
    - otherwise select a compatible version deterministically
    - never select a version solely because it appears first if compatibility has
    not been checked

    Do not claim that a version is compatible without evidence from tool results.

    ----------------------------------------------------------------------
    6. DEPENDENCY RESOLUTION
    ----------------------------------------------------------------------

    When the task requires adding a mod, dependencies must be considered.

    Distinguish between:

    - required dependencies
    - optional dependencies
    - recommended mods
    - addons
    - compatibility/integration mods

    Only required dependencies are automatically necessary for successful
    installation unless the user's request explicitly asks for optional or
    recommended additions.

    If a dependency tool exists, prefer it over inferring dependencies from
    descriptions.

    If the dependency information returned by a tool appears incomplete or
    contradictory, investigate using the available tools before concluding that
    there is no dependency.

    Descriptions, categories, addon relationships, and project metadata may provide
    evidence that further investigation is necessary, but they do NOT by themselves
    prove that a dependency is required.

    If a required dependency is discovered:

    1. resolve its exact project
    2. determine its compatible version
    3. add it if it is not already installed
    4. recursively resolve its required dependencies
    5. avoid resolving the same project more than once

    Continue until no unresolved required dependency remains.

    Never blindly add every addon or related project discovered.

    ----------------------------------------------------------------------
    7. RECOMMENDATION TASKS
    ----------------------------------------------------------------------

    When the user asks for recommendations, recommendations must be contextualized
    to the CURRENT MODPACK.

    For example, for:

    "Ajoute un ou deux mods QoL pour faciliter Create"

    the planner should:

    1. understand the current modpack environment
    2. identify Create
    3. inspect whether Create is already installed
    4. inspect existing mods when relevant
    5. search for suitable QoL mods
    6. evaluate candidates based on:
    - relevance to the user's request
    - compatibility
    - relationship to Create
    - usefulness
    - redundancy with already installed mods
    - whether the project is actually an addon/QoL mod rather than merely
        containing "Create" in its name
    7. select the requested number of suitable candidates
    8. verify their versions
    9. add them only if the user explicitly requested that they be added

    Do NOT interpret "QoL for Create" as:

    "search for any project whose name contains Create."

    Prefer semantic relevance based on descriptions, categories, and available
    metadata.

    ----------------------------------------------------------------------
    8. USER REQUESTS WITH MULTIPLE MODS
    ----------------------------------------------------------------------

    When the user asks for multiple mods:

    - treat each requested mod as part of the same modpack operation
    - reuse the same Minecraft version and loader
    - avoid repeating environment lookups
    - avoid repeating searches when results already identify the project
    - resolve dependencies across the complete operation
    - account for already installed mods

    Example:

    "Ajoute Create et deux mods QoL"

    The plan should conceptually be:

    current pack environment
    → inspect current mods
    → resolve Create
    → resolve compatible Create version
    → resolve required dependencies
    → identify suitable QoL candidates
    → verify compatibility
    → add requested mods
    → resolve their required dependencies
    → verify final state

    ----------------------------------------------------------------------
    9. DO NOT OVER-PLAN
    ----------------------------------------------------------------------

    Prefer the smallest number of tool calls that reliably completes the task.

    Do not call a tool when the information is already available from:

    - the user's request
    - the current modpack context
    - a previous step
    - a previous tool result

    Do not retrieve full mod information if the existing search result already
    contains everything required for the next action.

    Do not perform exploratory searches after the requested objective has already
    been satisfied.

    ----------------------------------------------------------------------
    10. NEVER INVENT TOOL ARGUMENTS
    ----------------------------------------------------------------------

    For every planned tool call, arguments must either:

    - be explicitly provided by the user
    - be known from the current modpack context
    - be returned by a previous tool call

    If an argument depends on a previous result, explicitly state that dependency.

    Example:

    1. Call `search_mods`
    Arguments:
    - query = "Create"

    2. Using the `mod_id` returned by step 1, call `get_mod_versions`
    Arguments:
    - mod_id = returned Create project ID

    3. Select a returned version where:
    - game_versions contains the pack's Minecraft version
    - loaders contains the pack's loader

    4. Call `add_mod`
    Arguments:
    - mod_id = selected project ID
    - version_id = selected compatible version ID

    ----------------------------------------------------------------------
    11. STATE CHANGES ARE PART OF THE OBJECTIVE
    ----------------------------------------------------------------------

    When the user explicitly asks to add, remove, replace, or modify something,
    the task is NOT complete when the agent has merely found the relevant
    information.

    The task is complete only after the required state change has successfully
    occurred.

    For example:

    User:
    "Ajoute Create."

    Incorrect completion:
    "Create version X is compatible."

    Correct completion:
    "`add_mod` successfully added Create version X to the current modpack."

    The executor must therefore continue through the mutation tool when the user's
    request requires a mutation.

    ----------------------------------------------------------------------
    12. TOOL RESULTS ARE AUTHORITATIVE
    ----------------------------------------------------------------------

    The executor must use tool results as the primary source of truth.

    If a tool result contradicts an earlier assumption:

    - update the plan execution accordingly
    - do not continue based on the obsolete assumption

    The executor should not repeat a tool call simply because the result differs
    from what was expected.

    ----------------------------------------------------------------------
    13. HANDLE FAILURES EXPLICITLY
    ----------------------------------------------------------------------

    If a required tool call fails:

    - do not claim success
    - determine whether the failure can be resolved using another available tool
    - retry only when there is a clear reason
    - otherwise stop with the unresolved problem clearly identified

    If a compatible version cannot be found:

    - do not add an incompatible version
    - stop or investigate an alternative only if the user's request allows it

    If a dependency cannot be resolved:

    - do not claim that the requested mod was successfully installed
    - clearly identify the unresolved dependency.

    ----------------------------------------------------------------------
    14. DO NOT MODIFY BEYOND USER INTENT
    ----------------------------------------------------------------------

    The planner must not turn a focused request into a general modpack redesign.

    For example:

    "Ajoute Create."

    does NOT authorize:

    - optimization mods
    - performance mods
    - storage mods
    - QoL mods
    - recommended addons

    unless required as dependencies or explicitly requested.

    Likewise:

    "Ajoute un ou deux mods QoL pour Create"

    does NOT authorize adding five Create addons.

    The plan must stay within the user's requested scope.

    ======================================================================
    TOOL SELECTION
    ======================================================================

    For EVERY planned tool call, specify:

    - the tool to call
    - the arguments to provide
    - why the tool is necessary
    - what information is expected from it
    - what subsequent action depends on its result

    Do not provide arguments whose values cannot yet be known.

    If an argument depends on a previous tool result, explicitly state that.

    Example:

    1. Call `get_pack_version`
    Arguments:
    - none

    Purpose:
    Obtain the Minecraft version and loader of the current modpack.

    Result used by:
    Version compatibility checks for every mod added during this task.

    2. Call `get_pack_mods`
    Arguments:
    - none

    Purpose:
    Determine which mods are already installed in the current modpack.

    Result used by:
    Avoid duplicate installations and contextualize recommendations.

    3. Call `search_mods`
    Arguments:
    - query = "Create"

    Purpose:
    Identify the exact Create project.

    Result used by:
    `get_mod_versions`.

    4. Call `get_mod_versions`
    Arguments:
    - mod_id = returned Create project ID

    Purpose:
    Retrieve available versions.

    Result used by:
    Select a version compatible with the current pack.

    ======================================================================
    AVAILABLE TOOLS
    ======================================================================

    {tools}

    ======================================================================
    EXECUTION STRATEGY
    ======================================================================

    The executor will follow your plan literally.

    Therefore:

    - never write vague instructions
    - never assume an action was performed if the corresponding tool has not been
    called
    - never stop after merely researching something when the user requested a
    modification
    - never add unrelated modifications
    - always maintain awareness that all operations target the CURRENT MODPACK

    The executor may receive tool results containing more information than
    expected.

    It must use those results instead of repeating previous calls.

    If a tool result already contains information needed by a later step, reuse it.

    ======================================================================
    COMPLETION LOGIC
    ======================================================================

    The completion condition depends on the user's intent.

    For INFORMATION requests:

    Stop when all information required to answer the question has been obtained.

    For RECOMMENDATION requests:

    Stop when enough suitable candidates have been identified and evaluated to
    satisfy the requested recommendation.

    For MODIFICATION requests:

    Stop only when the requested modifications have successfully been applied to
    the CURRENT MODPACK and all required dependencies have been resolved.

    For mixed requests:

    Stop only when both the requested information and requested state changes have
    been completed.

    Never add exploratory steps after the objective is already satisfied.

    ======================================================================
    STOP CONDITIONS
    ======================================================================

    Every plan must contain one precise final completion condition.

    Examples:

    For adding a mod:

    "Stop when the requested mod has been successfully added to the current
    modpack with a version compatible with the pack's Minecraft version and loader,
    and all required dependencies have been resolved."

    For adding Create + QoL mods:

    "Stop when Create and the requested number of suitable QoL mods have been
    successfully added to the current modpack with compatible versions, and all
    required dependencies for those additions have been resolved."

    For recommendations only:

    "Stop when the requested number of suitable compatible recommendations has
    been identified and no modification has been requested."

    ======================================================================
    OUTPUT FORMAT
    ======================================================================

    Return ONLY the following structure:

    OBJECTIVE:
    <one concise description of the user's actual objective in the current modpack>

    CONSTRAINTS:
    - <constraint>
    - <constraint>

    PLAN:
    1. <precise action>
    2. <precise action>
    3. <precise action>

    DATA FLOW:
    - <what information is obtained at each important step and where it is used>

    STOP CONDITION:
    <precise condition indicating that the task is complete>

    FINAL OUTPUT:
    <what information the final agent must provide to the user>

    Do not include analysis, commentary, tool calls, or a response to the user.
    """

    await update_agent_run_state(agent_run, "generating")

    planificator_response = await call_llm(
        messages=[
            {
                "role": "system",
                "content": PLANIFICATEUR_SP
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        tools=False
    )

    await update_agent_run_state(agent_run, "running")

    planificator_response = planificator_response.content

    AGENT_SP = """
    You are the execution agent of Modyx, an AI assistant for managing Minecraft
    modpacks.

    Your job is to fulfill the user's request by executing the provided plan with
    the available tools.

    The current modpack is always the default target. Never create or switch to
    another modpack unless explicitly requested.

    RULES:

    - Execute the plan step by step.
    - Use tools only when necessary.
    - Use previous tool results instead of repeating calls.
    - Treat tool results as the source of truth. Never invent IDs, versions,
    dependencies, compatibility, or modpack state.
    - Check the current modpack state before modifying it when necessary.
    - Preserve the user's actual intent. Do not add unrelated mods or changes.
    - When adding mods, ensure they are compatible with the current Minecraft
    version and loader.
    - Resolve required dependencies when necessary. Do not automatically add
    optional dependencies, recommendations, or addons.
    - If tool results reveal that the plan is incomplete, incorrect, or based on
    outdated assumptions, adapt the plan and continue.
    - If information is missing, use an available tool to obtain it rather than
    guessing.
    - If an operation fails, inspect the error and retry only when a meaningful
    correction is possible.
    - Avoid loops and repeated resolution of the same mod.
    - Stop as soon as the user's requested final state has been reached.

    IMPORTANT:

    The goal is not to blindly execute every planned step. The goal is to make the
    CURRENT MODPACK reach the state requested by the user.

    After completion, answer the user clearly with what was actually done and
    mention important versions, dependencies, or unresolved issues when relevant.

    Do not expose internal reasoning or execution details.
    """

    HISTORY.append({
        "role": "system",
        "content": AGENT_SP
    })

    agent_run.history.append({
        "role": "system",
        "content": AGENT_SP
    })
    await agent_run.save()

    HISTORY.append({
        "role": "user",
        "content": planificator_response
    })

    agent_run.history.append({
        "role": "user",
        "content": planificator_response
    })
    await agent_run.save()

    # print(f"Content      > {planificator_response}")

    # Etape 2 : Lancer le workflow
    while True:
        # Etape 2A : Appeler le LM
        await update_agent_run_state(agent_run, "generating")

        agent_response = await call_llm(HISTORY, tools=True)

        HISTORY.append(
            assistant_message_to_dict(agent_response)
        )

        agent_run.history.append(assistant_message_to_dict(agent_response))
        await agent_run.save()

        await update_agent_run_state(agent_run, "running")

        # print(f"Content      > {agent_response.content}")

        # Etape 2B : Si aucun tool calls alors arret du workflow
        if not agent_response.tool_calls:
            break

        # Etape 2C : Si tool calls alors execution de ceux ci

        await update_agent_run_state(agent_run, "tools_calling")

        for tool_call in agent_response.tool_calls:
        
            tool_name = tool_call.function.name

            try:
                arguments = json.loads(
                    tool_call.function.arguments
                )
            except json.JSONDecodeError as e:

                # print(
                #     f"ERROR : Arguments JSON invalides pour {tool_name}: "
                #     f"{e}"
                # )

                result = {
                    "error": "Invalid JSON arguments",
                    "details": str(e),
                }

            else:

                # print(f"Tools name   > {tool_name}")
                # print(f"Tools args   > {arguments}")

                try:

                    result = await registry.execute(
                        name=tool_name,
                        arguments=arguments,
                        context=context
                    )

                except Exception as e:

                    # print(f"ERROR :  Erreur tool : {e}")

                    result = {
                        "error": str(e),
                    }

            # print(f"Tools result > {result}")

            HISTORY.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(
                    result,
                    ensure_ascii=False,
                ),
            })

            agent_run.history.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(
                    result,
                    ensure_ascii=False,
                ),
            })
            await agent_run.save()

    # Etape 3 : Lancer le résumé
    RESPONSE_AGENT_SP = f"""
    Tu es l'assistant Modyx. À partir du résumé factuel suivant, rédige une réponse claire et concise pour l'utilisateur.

    Résumé factuel :
    {HISTORY}

    Question initiale de l'utilisateur :
    {prompt}

    Historique des réponses précédentes (résumées) :
    []

    Réponds dans la langue de l'utilisateur, de manière naturelle, sans mentionner les étapes techniques inutiles.
    """

    await update_agent_run_state(agent_run, "summarizing")

    summary = await call_llm(
        messages=[
            {
                "role": "system",
                "content": RESPONSE_AGENT_SP
            },
            {
                "role": "user",
                "content": "Fais le résumé"
            }
        ],
        tools=False
    )

    summary = summary.content

    await update_agent_run_state(agent_run, "running")

    agent_run.summary = summary
    await agent_run.save()

    assistant_message.content = [summary]
    await assistant_message.save()


async def agent_worker():
    while True:
        prompt, modpack_id, agent_run_id, assistant_message = await agent_queue.get()

        agent_run = None

        try:
            agent_run = await AgentRun.get(
                PydanticObjectId(agent_run_id)
            )

            await update_agent_run_state(agent_run, "running")

            await run_agent(
                prompt=prompt,
                modpack_id=modpack_id,
                agent_run=agent_run,
                assistant_message=assistant_message
            )

            await update_agent_run_state(agent_run, "success")

        except Exception as e:
            if agent_run:
                await update_agent_run_state(agent_run, "failed")

            print(f"Agent error: {e}")

        finally:
            agent_queue.task_done()