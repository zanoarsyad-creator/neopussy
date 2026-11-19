// iframe_cache.js
// Runs inside each cacheXXX.html iframe. Relays AppCache events to parent cache.html via postMessage.
(function () {
    var appCache = window.applicationCache;
    var manifestUrl = document.documentElement.getAttribute('manifest') || '';

    function post(type, extra) {
        var msg = { type: type };
        if (extra) {
            for (var key in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, key)) msg[key] = extra[key];
            }
        }
        window.parent.postMessage(msg, '*');
    }

    function postError(reason) {
        post('CACHE_ERROR', { reason: reason });
    }

    if (!appCache) {
        // AppCache was removed from modern desktop browsers; the PS4 browser still has it.
        postError('applicationCache is not available in this browser (AppCache is not supported over HTTPS in some browsers either)');
        return;
    }

    appCache.addEventListener('checking', function () {
        post('CACHE_CHECKING');
    }, false);

    appCache.addEventListener('downloading', function () {
        post('CACHE_DOWNLOADING');
    }, false);

    appCache.addEventListener('progress', function (e) {
        var percent = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : -1;
        post('CACHE_PROGRESS', { percent: percent, loaded: e.loaded, total: e.total });
    }, false);

    // Initial cache creation completed
    appCache.addEventListener('cached', function () {
        post('CACHE_COMPLETE');
    }, false);

    // Server manifest hasn't changed (Cache is up to date)
    appCache.addEventListener('noupdate', function () {
        post('CACHE_UP_TO_DATE');
    }, false);

    // Updated files downloaded, swap cache so new assets are active immediately
    appCache.addEventListener('updateready', function () {
        try {
            appCache.swapCache();
        } catch (e) {}
        post('CACHE_UPDATED');
    }, false);

    // The manifest was removed (404/410), so the browser deleted the cache.
    appCache.addEventListener('obsolete', function () {
        postError('cache was obsoleted - the manifest returned 404/410 or was removed');
    }, false);

    appCache.addEventListener('error', function () {
        var status = appCache.status;
        var statusNames = ['UNCACHED', 'IDLE', 'CHECKING', 'DOWNLOADING', 'UPDATEREADY', 'OBSOLETE'];
        var statusName = statusNames[status] || ('status=' + status);
        var reason = 'AppCache error event (status: ' + statusName + ')';

        if (!manifestUrl) {
            postError(reason + ' - no manifest declared on the cache page');
            return;
        }

        // Diagnose the two usual causes: wrong MIME type, or a missing file in the manifest.
        var reported = false;
        function finish(detail) {
            if (reported) return;
            reported = true;
            postError(reason + detail);
        }

        try {
            var probe = new XMLHttpRequest();
            probe.open('GET', manifestUrl, true);
            probe.onreadystatechange = function () {
                if (probe.readyState !== 4) return;
                var type = '';
                try { type = probe.getResponseHeader('Content-Type') || ''; } catch (e) {}
                if (type.toLowerCase().indexOf('text/cache-manifest') === -1) {
                    finish(' - server sent Content-Type "' + (type || '(none)') + '" for ' + manifestUrl + '; it must be text/cache-manifest');
                } else {
                    finish(' - a file listed in ' + manifestUrl + ' could not be downloaded (404)');
                }
            };
            probe.onerror = function () { finish(' - could not fetch ' + manifestUrl); };
            probe.send();
            setTimeout(function () { finish(''); }, 4000);
        } catch (e) {
            finish('');
        }
    }, false);
})();
