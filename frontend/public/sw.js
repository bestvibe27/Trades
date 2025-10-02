// Service Worker for Trading Bot Platform
const CACHE_NAME = 'trading-bot-v1.0.0';
const STATIC_CACHE = 'trading-bot-static-v1.0.0';
const DYNAMIC_CACHE = 'trading-bot-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    // Add other static assets as needed
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
    /\/api\/health/,
    /\/api\/market\/overview/,
    /\/api\/portfolio\/summary/,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Serving from cache:', request.url);
                    return cachedResponse;
                }
                
                // For API requests, try network first
                if (url.pathname.startsWith('/api/')) {
                    return handleApiRequest(request);
                }
                
                // For static files, try network first
                return handleStaticRequest(request);
            })
            .catch((error) => {
                console.error('Fetch failed:', error);
                
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                
                // Return a generic error response
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            })
    );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful API responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // If network fails, try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // If network fails, try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'trading-orders') {
        event.waitUntil(syncTradingOrders());
    } else if (event.tag === 'market-data') {
        event.waitUntil(syncMarketData());
    }
});

// Sync trading orders when back online
async function syncTradingOrders() {
    try {
        // Get pending orders from IndexedDB
        const pendingOrders = await getPendingOrders();
        
        for (const order of pendingOrders) {
            try {
                const response = await fetch('/api/trading/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(order)
                });
                
                if (response.ok) {
                    // Remove from pending orders
                    await removePendingOrder(order.id);
                    console.log('Order synced successfully:', order.id);
                }
            } catch (error) {
                console.error('Failed to sync order:', order.id, error);
            }
        }
    } catch (error) {
        console.error('Failed to sync trading orders:', error);
    }
}

// Sync market data when back online
async function syncMarketData() {
    try {
        // Update market data cache
        const response = await fetch('/api/market/overview');
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put('/api/market/overview', response.clone());
            console.log('Market data synced successfully');
        }
    } catch (error) {
        console.error('Failed to sync market data:', error);
    }
}

// Push notifications for trading alerts
self.addEventListener('push', (event) => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New trading alert',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: '/icons/view-96x96.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Trading Bot Alert', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/trading')
        );
    }
});

// Helper functions for IndexedDB operations
async function getPendingOrders() {
    // Implementation would depend on your IndexedDB setup
    // This is a placeholder
    return [];
}

async function removePendingOrder(orderId) {
    // Implementation would depend on your IndexedDB setup
    // This is a placeholder
    console.log('Removing pending order:', orderId);
}

// Periodic background sync for market data
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'market-data-sync') {
        event.waitUntil(syncMarketData());
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(STATIC_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
});

console.log('Service Worker loaded successfully');










