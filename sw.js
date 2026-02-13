// Service Worker: shows system notification when page says "time's up"
// (Browsers often only show notifications from SW, not from page timer callbacks)
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'timeUp') {
    var title = 'Time\'s up!';
    var options = { body: 'Focus session complete. Great focus!', tag: 'astro-focus-timeup' };
    self.registration.showNotification(title, options).catch(function () {});
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].visibilityState === 'visible') {
          clientList[i].focus();
          return;
        }
      }
      if (clients.openWindow) clients.openWindow('/');
    })
  );
});
