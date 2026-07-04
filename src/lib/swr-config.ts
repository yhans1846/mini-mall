// src/lib/swr-config.ts — SWR 全局配置
import type { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  dedupingInterval: 30000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  keepPreviousData: true,
};
