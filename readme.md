# Notes/Roadmap

## Zooming

- test zooming in/out (*multiple times). Path positions and scale should be correct
- modify draw functions to take zoom level into account
- per above, drawing while zoomed should apply the coords as if no zoom applied, then apply scale and transform to position appropriately

## UI

- all: drag the UI pen to change size *note: this shouldn't be absolute (ie not pinned to event coords)
- iOS: tap the UI pen to reveal controls
- desktop: controls always visible
- all: if a drag moves over the UI elements (either drawing or dragging), current event should continue unhindered
- controls: undo/redo, colour palette, eraser/pen/drag

## iOS

- pinch to zoom (*while* dragging)

## Keyboard

- http://media.smashingmagazine.com/wp-content/uploads/uploader/images/photoshop-keyboard-shortcuts/photoshop-keyboard-shortcuts.pdf
- alt/option with mousewheel => change opacity
- shift with mousewheel => zoom

## Ideas/Todo

- send qd.js via express which injects the initial path data right into the javascript -- saves the extra ajax request
- upgrade to express v3: http://tjholowaychuk.com/post/21162751096/express-3-0-0-alpha1 & http://tjholowaychuk.com/post/21354415454/express-3-x-alpha-reference-docs
- when drawing, if reach windoe edge, auto scroll?
- display an initial sketch for new drawings which is removed when the user starts drawing
- optimize (underscore can help, eg _.memoize)
- put on github with relevant licence (make sure all libraries have credit)
- ability to clone & edit someone else's drawing
- quick access to the url to share (copy to clipboard?)
- quickdraw.io? quickdr.aw?
- some support for browsers with no svg/vml capabilities
- set appropriate cache/expiry headers, particularly for qd.js

# Coverage

## Change pen size

- iOS: drag UI pen
- desktop: drag UI pen or use mousewheel

## Change pen colour

- iOS: tap colour in controls palette
- desktop: tap colour in controls palette or use number key

## Change pen opacity

- iOS:  circular slider
- desktop: hold alt/option with mousewheel

## Change pen mode

- iOS: ?
- desktop: ?

## Zoom

- iOS: pinch (todo)
- desktop: hold shift with mousewheel

## Pan

- iOS: two-finger drag
- desktop: hold shift with drag

## Undo/Redo

- iOS: ?
- desktop: ?