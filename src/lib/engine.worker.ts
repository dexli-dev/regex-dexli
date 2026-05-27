/// <reference lib="webworker" />
// Web Worker that holds the native RegExp call. The main thread races a
// timeout against this worker's response; on overrun the main thread calls
// `worker.terminate()`, freeing us from the catastrophic-backtrack tarpit
// (bar item 6).
//
// Keep this file mechanically thin — all real logic lives in engine-core,
// which is independently unit-testable on the main thread.

import { runMatch } from './engine-core';
import type { Flags } from './url-state';
import type { EvalResult } from './engine';

export interface EvalRequest {
	pattern: string;
	testText: string;
	flags: Flags;
}

// `self` inside a module worker is the DedicatedWorkerGlobalScope. We cast
// once so the message handler is typed without polluting the worker DTS.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<EvalRequest>) => {
	const { pattern, testText, flags } = event.data;
	const result: EvalResult = runMatch(pattern, testText, flags);
	ctx.postMessage(result);
};
