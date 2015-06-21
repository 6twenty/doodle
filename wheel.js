(function () {

  var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
      toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
      slice  = Array.prototype.slice,
      nullLowestDeltaTimeout, lowestDelta;

  toBind.forEach(function (bind) { window.addEventListener(bind, handler, false); });

  function handler(event) {
    var deltaY = 0, absDelta = 0;
    event.type = 'mousewheel';

    // Old school scrollwheel delta
    if ( 'detail'      in event ) { deltaY = event.detail * -1;      }
    if ( 'wheelDelta'  in event ) { deltaY = event.wheelDelta;       }
    if ( 'wheelDeltaY' in event ) { deltaY = event.wheelDeltaY;      }

    // New school wheel delta (wheel event)
    if ( 'deltaY' in event ) { deltaY = event.deltaY * -1; }

    // No change actually happened, no reason to go any further
    if ( deltaY === 0 ) { return; }

    // Store lowest absolute delta to normalize the delta values
    absDelta = Math.abs(deltaY);

    if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }

    // Get a whole, normalized value for the deltas
    deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

    // Add information to the event object
    event.deltaY = deltaY;

    // Clearout lowestDelta after sometime to better
    // handle multiple device types that give different
    // a different lowestDelta
    // Ex: trackpad = 3 and mouse wheel = 120
    if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
    nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

    var wheelEvent = new CustomEvent('mousewheel', { detail: event.deltaY });
    window.dispatchEvent(wheelEvent);
  }

  function nullLowestDelta() { lowestDelta = null; }

})();
