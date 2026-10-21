import { useContext } from "react";
import { MinecraftContext } from "./MinecraftContext.js";

export function useMinecraft() {
    const context = useContext(MinecraftContext);
    if (!context) {
        throw new Error("useMinecraft must be used within a MinecraftProvider");
    }
    return context;
}