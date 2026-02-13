// Runs in background so the timer fires even when the tab is hidden or user is in another app
let intervalId;
self.onmessage = function (e) {
  var endTime = e.data.endTime;
  if (typeof endTime !== 'number') return;
  intervalId = setInterval(function () {
    if (Date.now() >= endTime) {
      clearInterval(intervalId);
      self.postMessage({ type: 'timeUp' });
    }
  }, 500);
};
