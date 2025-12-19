import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export type OpenRouterModel = {
    id: string
    name: string
    description?: string
    context_length?: number
    pricing?: {
        prompt: string
        completion: string
    }
}

export type CustomModel = {
    id: string
    name: string
}

export function useOpenRouterModels(apiKey: string) {
    const [allModels, setAllModels] = useState<OpenRouterModel[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [customModels, setCustomModels] = useLocalStorage<CustomModel[]>('research-agent-custom-models', [])

    const fetchModels = useCallback(async () => {
        if (!apiKey) {
            setError('OpenRouter API key required')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`)
            }

            const data = await response.json()
            setAllModels(data.data || [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [apiKey])

    const addCustomModel = useCallback((model: CustomModel) => {
        // Don't add duplicates
        if (customModels.some((m: CustomModel) => m.id === model.id)) {
            return
        }
        setCustomModels([...customModels, model])
    }, [customModels, setCustomModels])

    const removeCustomModel = useCallback((modelId: string) => {
        setCustomModels(customModels.filter((m: CustomModel) => m.id !== modelId))
    }, [customModels, setCustomModels])

    return {
        allModels,
        customModels,
        loading,
        error,
        fetchModels,
        addCustomModel,
        removeCustomModel
    }
}
