import { SimpleCache } from "../vendor/SimpleCache.js";

SimpleCache.global.addEventListener("install", (event)=>{
	console.log("[SERVICE WORKER]: Installing...");
	event.waitUntil((async ()=>{
		console.log("[SERVICE WORKER]: Installed Successfully.");
		SimpleCache.global.skipWaiting();
	})());
});

SimpleCache.global.addEventListener("activate", (event)=>{
	console.log("[SERVICE WORKER]: Activating...");
	console.log("[SERVICE WORKER]: Activated Successfully.");
	SimpleCache.global.clients.claim();
});

SimpleCache.global.addEventListener("fetch", function(event) {
	
});