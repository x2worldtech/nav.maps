import { ExternalBlob, createActor } from "@/backend";
import type { Backend } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

const canisterId = import.meta.env.CANISTER_ID_BACKEND as string;

const uploadFile = async (_file: ExternalBlob): Promise<Uint8Array> => {
  return new Uint8Array();
};

const downloadFile = async (_file: Uint8Array): Promise<ExternalBlob> => {
  return ExternalBlob.fromBytes(new Uint8Array());
};

export function useBackendActor() {
  return useActor<Backend>(() =>
    createActor(canisterId, uploadFile, downloadFile),
  );
}
