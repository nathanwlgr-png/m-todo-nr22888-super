import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// MODO POTÊNCIA INTELIGENTE: cache conservador global
			// Evita polling contínuo e re-fetches desnecessários
			staleTime: 2 * 60 * 1000,       // 2 min — não refetch antes disso
			gcTime: 10 * 60 * 1000,          // 10 min — mantém cache em memória
			refetchOnMount: false,            // não refetch ao montar se há cache
			refetchOnReconnect: false,        // não refetch ao reconectar
		},
	},
});