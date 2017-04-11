class CanvasRenderLayer extends CanvasLayer {

  render(path) {
    path.update()
    path.simplify()
    this.beginPath(path)

    // Variable width setup
    const threshold = Math.floor(path.size / 2)
    const step = Math.min(1, App.easeOutQuint(path.size / 100)) * 8
    const offset = 0
    const reducing = false
    const last = path.segments.length - 1

    path.segments.forEach((segment, i, segments) => {
      const next = segments[i + 1]

      if (!next) {
        return
      }

      if (i === 0) {
        this.ctx.moveTo(segment.point.x, segment.point.y)
      }

      this.ctx.bezierCurveTo(segment.handleOut.x, segment.handleOut.y, next.handleIn.x, next.handleIn.y, next.point.x, next.point.y)

      // if (i === 0) d += 'M';
      // if (segment.handleIn) d += (segment.handleIn + ' ');
      // d += (segment.point + ' ');
      // if (segment.handleOut) d += ('C' + segment.handleOut + ' ');

      // // Variable width offset
      // if (i === 0 || i === last) {
      //   offset = 0;
      // } else if (typeof reducing === 'number') {
      //   offset += reducing;
      // } else if ((Math.abs(offset) / step) >= (last - i)) {
      //   reducing = reducing || (offset > 0 ? -step : step);
      //   offset += reducing;
      // } else {
      //   var diff = Math.random() >= 0.5 ? step : -step;
      //   if (Math.abs(offset + diff) > threshold) diff *= -1;
      //   offset += diff;
      // }

      // // Variable width points
      // var add = { x: offset, y: offset };
      // segment.point_ = segment.point.add(add);
      // if (segment.handleIn) segment.handleIn_ = segment.handleIn.add(add);
      // if (segment.handleOut) segment.handleOut_ = segment.handleOut.add(add);
      //
      // if (i === 0) d_ += 'M';
      // if (segment.handleIn_) d_ += (segment.handleIn_ + ' ');
      // d_ += (segment.point_ + ' ');
      // if (segment.handleOut_) d_ += ('C' + segment.handleOut_ + ' ');
    })

    this.ctx.stroke()
  }

}
