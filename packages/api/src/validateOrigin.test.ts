import { describe, expect, it } from "vitest";
import { validateOrigin } from "./index";

describe("validateOrigin", () => {
	it("should allow valid domains", () => {
		expect(validateOrigin("https://example.com", undefined)).toBe(true);
		expect(validateOrigin("https://sub.example.com", undefined)).toBe(true);
		expect(
			validateOrigin("https://lastfm-viewer.vercel.app", undefined)
		).toBe(true);
		expect(validateOrigin("https://dash.cloudflare.com", undefined)).toBe(
			true
		);
		expect(validateOrigin(undefined, "https://localhost:3000")).toBe(true);
		expect(validateOrigin(undefined, "http://127.0.0.1:8080")).toBe(true);
	});

	it("should block invalid domains", () => {
		expect(validateOrigin("https://malicious-site.com", undefined)).toBe(
			false
		);
		expect(validateOrigin("https://192.168.1.1", undefined)).toBe(false);
		expect(validateOrigin("https://[::1]", undefined)).toBe(false);
		expect(validateOrigin("invalid$domain.com", undefined)).toBe(false);
	});

	it("should block IDN domains", () => {
		expect(
			validateOrigin("https://xn--eckwd4c7c.xn--zckzah", undefined)
		).toBe(false);
	});

	it("should allow new TLDs", () => {
		expect(validateOrigin("https://example.coffee", undefined)).toBe(true);
	});
});
