import { useEffect, useState, useCallback } from "react";
import { MinecraftContext } from "./MinecraftContext.js";

export function MinecraftProvider({ children }) {
    const [config, setConfig] = useState(null);
    const [detectedPaths, setDetectedPaths] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadConfig = useCallback(async () => {
        try {
            const result = await window.modyx.minecraft.getConfig();
            if (result.success) {
                setConfig(result.data);
            }
        } catch (err) {
            console.error("Failed to load Minecraft config:", err);
        }
    }, []);

    const refreshPaths = useCallback(async () => {
        try {
            setError(null);
            const result = await window.modyx.minecraft.findPaths();
            if (result.success) {
                setDetectedPaths(result.data);
            }
        } catch (err) {
            console.error("Failed to find Minecraft paths:", err);
            setError("Impossible de détecter les installations Minecraft");
        }
    }, []);

    const autoDetect = useCallback(async () => {
        try {
            setError(null);
            const result = await window.modyx.minecraft.autoDetect();
            if (result.success && result.data) {
                setConfig(result.data);
                return result.data;
            }
            setError("Aucune installation Minecraft valide trouvée");
            return null;
        } catch (err) {
            console.error("Auto-detect failed:", err);
            setError("Erreur lors de l'auto-détection");
            return null;
        }
    }, []);

    const pickFolder = useCallback(async () => {
        try {
            setError(null);
            const result = await window.modyx.minecraft.pickFolder();
            if (result.success && !result.canceled) {
                return { path: result.path, valid: result.valid };
            }
            return null;
        } catch (err) {
            console.error("Pick folder failed:", err);
            setError("Erreur lors de la sélection du dossier");
            return null;
        }
    }, []);

    const saveConfig = useCallback(async (newConfig) => {
        try {
            setError(null);
            const result = await window.modyx.minecraft.saveConfig(newConfig);
            if (result.success) {
                setConfig(result.data);
                return true;
            }
            setError("Impossible de sauvegarder la configuration");
            return false;
        } catch (err) {
            console.error("Save config failed:", err);
            setError("Erreur lors de la sauvegarde");
            return false;
        }
    }, []);

    const setPath = useCallback(async (modsPath, launcherType = "custom", customLabel = "Dossier personnalisé") => {
        const newConfig = {
            path: modsPath,
            launcherType,
            customLabel,
            savedAt: new Date().toISOString()
        };
        return await saveConfig(newConfig);
    }, [saveConfig]);

    useEffect(() => {
        async function init() {
            await loadConfig();
            await refreshPaths();
            setIsLoading(false);
        }
        init();
    }, [loadConfig, refreshPaths]);

    const modsPath = config?.path || null;
    const isConfigured = !!config?.path;

    const value = {
        config,
        detectedPaths,
        isLoading,
        error,
        modsPath,
        isConfigured,
        refreshPaths,
        autoDetect,
        pickFolder,
        saveConfig,
        setPath,
        setConfig
    };

    return (
        <MinecraftContext.Provider value={value}>
            {children}
        </MinecraftContext.Provider>
    );
}