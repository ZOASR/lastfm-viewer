import { describe, it, expect } from 'vitest';
import type { UserRecentTracksRes, TrackInfoRes } from "@lastfm-viewer/utils/LFMtypes";
import type { Release, ReleaseInfo, Image } from "@lastfm-viewer/utils/MBtypes";

const API_BASE = 'http://127.0.0.1:8787';

describe('LastFM API Endpoints', () => {
	// Test user tracks endpoint
	it('should fetch user tracks', async () => {
		const username = 'zoasr'; // Replace with a real LastFM username
		const response = await fetch(`${API_BASE}/api/lastfm/user-tracks/${username}`);
		expect(response.status).toBe(200);
		expect(response.headers.get('x-cache')).toBe('HIT');
		const data = await response.json() as UserRecentTracksRes;
		expect(data).toHaveProperty('recenttracks');
		expect(data.recenttracks).toHaveProperty('track');
	});

	// Test track info endpoint
	it('should fetch track info', async () => {
		const params = new URLSearchParams({
			track: 'Bohemian Rhapsody',
			artist: 'Queen'
		});
		const response = await fetch(`${API_BASE}/api/lastfm/track-info?${params}`);
		expect(response.status).toBe(200);
		expect(response.headers.get('x-cache')).toBe('HIT');
		const data = await response.json() as TrackInfoRes;
		expect(data).toHaveProperty('track');
		expect(data.track).toHaveProperty('name', 'Bohemian Rhapsody');
		expect(data.track).toHaveProperty('artist');
	});

	// Test MusicBrainz releases endpoint
	it('should fetch MusicBrainz releases', async () => {
		const params = new URLSearchParams({
			track: 'Bohemian Rhapsody',
			artist: 'Queen',
			album: 'A Night at the Opera'
		});
		const response = await fetch(`${API_BASE}/api/lastfm/mb-releases?${params}`);
		expect(response.status).toBe(200);
		const data = await response.json() as Release[];
		expect(Array.isArray(data)).toBe(true);
		if (data.length > 0) {
			expect(data[0]).toHaveProperty('id');
			expect(data[0]).toHaveProperty('title');
		}
	});

	// Test MusicBrainz release info endpoint
	it('should fetch MusicBrainz release info', async () => {
		const mbid = 'a06db051-e3ea-496c-b8f2-bc1b2d75158b';
		const response = await fetch(`${API_BASE}/api/lastfm/mb-release/${mbid}`);
		expect(response.headers.get('x-cache')).toBe('HIT');
		// This might return 400 if the MBID is not found, which is expected
		const data = await response.json() as ReleaseInfo | { error: string };
		if (response.ok) {
			expect(data).toHaveProperty('id');
			expect(data).toHaveProperty('title');
		} else {
			expect(data).toHaveProperty('error');
		}
	});

	// Test cover art endpoint
	it('should fetch cover art', async () => {
		const mbid = 'a06db051-e3ea-496c-b8f2-bc1b2d75158b';
		const response = await fetch(`${API_BASE}/api/lastfm/cover-art/${mbid}`);
		expect(response.headers.get('x-cache')).toBe('HIT');
		// This might return 400 if the MBID is not found, which is expected
		const data = await response.json() as Image[] | { error: string };
		if (response.ok && Array.isArray(data)) {
			expect(data.length).toBeGreaterThan(0);
			expect(data[0]).toHaveProperty('image');
			expect(data[0]).toHaveProperty('thumbnails');
		} else {
			expect(data).toHaveProperty('error');
		}
	});
});