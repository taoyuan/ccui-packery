/***********************************************
* CCUI Packery JavaScript Library
* Authors: https://github.com/torworx/ccui-foundation/blob/master/README.md 
* Compiled At: 2013-10-29 14:39
***********************************************/


( function( window ) {

"use strict";
var Packery = window.Packery = function() {};

function rectDefinition() {



function Rect( props ) {
  
  for ( var prop in Rect.defaults ) {
    this[ prop ] = Rect.defaults[ prop ];
  }

  for ( prop in props ) {
    this[ prop ] = props[ prop ];
  }

}


Packery.Rect = Rect;

Rect.defaults = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};


Rect.prototype.contains = function( rect ) {
  
  var otherWidth = rect.width || 0;
  var otherHeight = rect.height || 0;
  return this.x <= rect.x &&
    this.y <= rect.y &&
    this.x + this.width >= rect.x + otherWidth &&
    this.y + this.height >= rect.y + otherHeight;
};


Rect.prototype.overlaps = function( rect ) {
  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;
  return this.x < rectRight &&
    thisRight > rect.x &&
    this.y < rectBottom &&
    thisBottom > rect.y;
};


Rect.prototype.getMaximalFreeRects = function( rect ) {
  if ( !this.overlaps( rect ) ) {
    return false;
  }

  var freeRects = [];
  var freeRect;

  var thisRight = this.x + this.width;
  var thisBottom = this.y + this.height;
  var rectRight = rect.x + rect.width;
  var rectBottom = rect.y + rect.height;
  if ( this.y < rect.y ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: this.width,
      height: rect.y - this.y
    });
    freeRects.push( freeRect );
  }
  if ( thisRight > rectRight ) {
    freeRect = new Rect({
      x: rectRight,
      y: this.y,
      width: thisRight - rectRight,
      height: this.height
    });
    freeRects.push( freeRect );
  }
  if ( thisBottom > rectBottom ) {
    freeRect = new Rect({
      x: this.x,
      y: rectBottom,
      width: this.width,
      height: thisBottom - rectBottom
    });
    freeRects.push( freeRect );
  }
  if ( this.x < rect.x ) {
    freeRect = new Rect({
      x: this.x,
      y: this.y,
      width: rect.x - this.x,
      height: this.height
    });
    freeRects.push( freeRect );
  }

  return freeRects;
};

Rect.prototype.canFit = function( rect ) {
  return this.width >= rect.width && this.height >= rect.height;
};

return Rect;

}



if ( typeof define === 'function' && define.amd ) {
  
  define( rectDefinition );
} else {
  
  window.Packery = window.Packery || {};
  window.Packery.Rect = rectDefinition();
}

})( window );

( function( window ) {

'use strict';



function packerDefinition( Rect ) {

function Packer( width, height ) {
  this.width = width || 0;
  this.height = height || 0;

  this.reset();
}

Packer.prototype.reset = function() {
  this.spaces = [];
  this.newSpaces = [];

  var initialSpace = new Rect({
    x: 0,
    y: 0,
    width: this.width,
    height: this.height
  });

  this.spaces.push( initialSpace );
};


Packer.prototype.pack = function( rect ) {
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    if ( space.canFit( rect ) ) {
      this.placeInSpace( rect, space );
      break;
    }
  }
};

Packer.prototype.placeInSpace = function( rect, space ) {
  
  rect.x = space.x;
  rect.y = space.y;

  this.placed( rect );
};


Packer.prototype.placed = function( rect ) {
  
  var revisedSpaces = [];
  for ( var i=0, len = this.spaces.length; i < len; i++ ) {
    var space = this.spaces[i];
    var newSpaces = space.getMaximalFreeRects( rect );
    if ( newSpaces ) {
      revisedSpaces.push.apply( revisedSpaces, newSpaces );
    } else {
      revisedSpaces.push( space );
    }
  }

  this.spaces = revisedSpaces;
  Packer.mergeRects( this.spaces );

  this.spaces.sort( Packer.spaceSorterTopLeft );
};
Packer.mergeRects = function( rects ) {
  for ( var i=0, len = rects.length; i < len; i++ ) {
    var rect = rects[i];
    if ( !rect ) {
      continue;
    }
    var compareRects = rects.slice(0);
    compareRects.splice( i, 1 );
    var removedCount = 0;
    for ( var j=0, jLen = compareRects.length; j < jLen; j++ ) {
      var compareRect = compareRects[j];
      var indexAdjust = i > j ? 0 : 1;
      if ( rect.contains( compareRect ) ) {
        rects.splice( j + indexAdjust - removedCount, 1 );
        removedCount++;
      }
    }
  }

  return rects;
};


Packer.spaceSorterTopLeft = function( a, b ) {
  return a.y - b.y || a.x - b.x;
};


Packer.spaceSorterLeftTop = function( a, b ) {
  return a.x - b.x || a.y - b.y;
};

return Packer;

}



if ( typeof define === 'function' && define.amd ) {
  
  define( [ './rect' ], packerDefinition );
} else {
  
  var Packery = window.Packery = window.Packery || {};
  Packery.Packer = packerDefinition( Packery.Rect );
}

})( window );



( function( window ) {

'use strict';



function itemDefinition( getStyleProperty, Outlayer, Rect ) {

var transformProperty = getStyleProperty('transform');


var Item = function PackeryItem() {
  Outlayer.Item.apply( this, arguments );
};

Item.prototype = new Outlayer.Item();

var protoCreate = Item.prototype._create;
Item.prototype._create = function() {
  
  protoCreate.call( this );
  this.rect = new Rect();
  
  this.placeRect = new Rect();
};



Item.prototype.dragStart = function() {
  this.getPosition();
  this.removeTransitionStyles();
  
  if ( this.isTransitioning && transformProperty ) {
    this.element.style[ transformProperty ] = 'none';
  }
  this.getSize();
  this.isPlacing = true;
  this.needsPositioning = false;
  this.positionPlaceRect( this.position.x, this.position.y );
  this.isTransitioning = false;
  this.didDrag = false;
};


Item.prototype.dragMove = function( x, y ) {
  this.didDrag = true;
  var packerySize = this.layout.size;
  x -= packerySize.paddingLeft;
  y -= packerySize.paddingTop;
  this.positionPlaceRect( x, y );
};

Item.prototype.dragStop = function() {
  this.getPosition();
  var isDiffX = this.position.x !== this.placeRect.x;
  var isDiffY = this.position.y !== this.placeRect.y;
  
  this.needsPositioning = isDiffX || isDiffY;
  
  this.didDrag = false;
};
Item.prototype.positionPlaceRect = function( x, y, isMaxYOpen ) {
  this.placeRect.x = this.getPlaceRectCoord( x, true );
  this.placeRect.y = this.getPlaceRectCoord( y, false, isMaxYOpen );
};


Item.prototype.getPlaceRectCoord = function( coord, isX, isMaxOpen ) {
  var measure = isX ? 'Width' : 'Height';
  var size = this.size[ 'outer' + measure ];
  var segment = this.layout[ isX ? 'columnWidth' : 'rowHeight' ];
  var parentSize = this.layout.size[ 'inner' + measure ];
  if ( !isX ) {
    parentSize = Math.max( parentSize, this.layout.maxY );
    if ( !this.layout.rowHeight ) {
      parentSize -= this.layout.gutter;
    }
  }

  var max;

  if ( segment ) {
    segment += this.layout.gutter;
    parentSize += isX ? this.layout.gutter : 0;
    coord = Math.round( coord / segment );
    var maxSegments = Math[ isX ? 'floor' : 'ceil' ]( parentSize / segment );
    maxSegments -= Math.ceil( size / segment );
    max = maxSegments;
  } else {
    max = parentSize - size;
  }

  coord = isMaxOpen ? coord : Math.min( coord, max );
  coord *= segment || 1;

  return Math.max( 0, coord );
};

Item.prototype.copyPlaceRectPosition = function() {
  this.rect.x = this.placeRect.x;
  this.rect.y = this.placeRect.y;
};

return Item;

}



if ( typeof define === 'function' && define.amd ) {
  
  define( [
      'get-style-property/get-style-property',
      'outlayer/outlayer',
      './rect'
    ],
    itemDefinition );
} else {
  
  window.Packery.Item = itemDefinition(
    window.getStyleProperty,
    window.Outlayer,
    window.Packery.Rect
  );
}

})( window );



( function( window ) {

'use strict';
function packeryDefinition( classie, getSize, Outlayer, Rect, Packer, Item ) {


var Packery = Outlayer.create('packery');
Packery.Item = Packery.prototype.settings.item = Item;

Packery.prototype._create = function() {
  
  Outlayer.prototype._create.call( this );
  this.packer = new Packer();
  this.stamp( this.options.stamped );
  var _this = this;
  this.handleDraggabilly = {
    dragStart: function( draggie ) {
      _this.itemDragStart( draggie.element );
    },
    dragMove: function( draggie ) {
      _this.itemDragMove( draggie.element, draggie.position.x, draggie.position.y );
    },
    dragEnd: function( draggie ) {
      _this.itemDragEnd( draggie.element );
    }
  };

  this.handleUIDraggable = {
    start: function handleUIDraggableStart( event ) {
      _this.itemDragStart( event.currentTarget );
    },
    drag: function handleUIDraggableDrag( event, ui ) {
      _this.itemDragMove( event.currentTarget, ui.position.left, ui.position.top );
    },
    stop: function handleUIDraggableStop( event ) {
      _this.itemDragEnd( event.currentTarget );
    }
  };

};
Packery.prototype._resetLayout = function() {
  this.getSize();

  this._getMeasurements();
  this.packer.width = this.size.innerWidth + this.gutter;
  this.packer.height = Number.POSITIVE_INFINITY;
  this.packer.reset();
  this.maxY = 0;
};


Packery.prototype._getMeasurements = function() {
  this._getMeasurement( 'columnWidth', 'width' );
  this._getMeasurement( 'rowHeight', 'height' );
  this._getMeasurement( 'gutter', 'width' );
};

Packery.prototype._getItemLayoutPosition = function( item ) {
  this._packItem( item );
  return item.rect;
};



Packery.prototype._packItem = function( item ) {
  this._setRectSize( item.element, item.rect );
  
  this.packer.pack( item.rect );
  this._setMaxY( item.rect );
};


Packery.prototype._setMaxY = function( rect ) {
  this.maxY = Math.max( rect.y + rect.height, this.maxY );
};


Packery.prototype._setRectSize = function( elem, rect ) {
  var size = getSize( elem );
  var w = size.outerWidth;
  var h = size.outerHeight;
  
  var colW = this.columnWidth + this.gutter;
  var rowH = this.rowHeight + this.gutter;
  w = this.columnWidth ? Math.ceil( w / colW ) * colW : w + this.gutter;
  h = this.rowHeight ? Math.ceil( h / rowH ) * rowH : h + this.gutter;
  
  rect.width = Math.min( w, this.packer.width );
  rect.height = h;
};

Packery.prototype._getContainerSize = function() {
  return {
    height: this.maxY - this.gutter
  };
};
Packery.prototype._manageStamp = function( elem ) {

  var item = this.getItem( elem );
  var rect;
  if ( item && item.isPlacing ) {
    rect = item.placeRect;
  } else {
    var offset = this._getElementOffset( elem );
    rect = new Rect({
      x: this.options.isOriginLeft ? offset.left : offset.right,
      y: this.options.isOriginTop ? offset.top : offset.bottom
    });
  }

  this._setRectSize( elem, rect );
  
  this.packer.placed( rect );
  this._setMaxY( rect );
};
Packery.prototype.sortItemsByPosition = function() {
  this.items.sort( function( a, b ) {
    return a.position.y - b.position.y || a.position.x - b.position.x;
  });
};


Packery.prototype.fit = function( elem, x, y ) {
  var item = this.getItem( elem );
  if ( !item ) {
    return;
  }
  this._getMeasurements();
  this.stamp( item.element );
  
  item.getSize();
  
  item.isPlacing = true;
  
  x = x === undefined ? item.rect.x: x;
  y = y === undefined ? item.rect.y: y;
  item.positionPlaceRect( x, y, true );

  this._bindFitEvents( item );
  item.moveTo( item.placeRect.x, item.placeRect.y );
  
  this.layout();
  this.unstamp( item.element );
  this.sortItemsByPosition();
  
  item.isPlacing = false;
  
  item.copyPlaceRectPosition();
};


Packery.prototype._bindFitEvents = function( item ) {
  var _this = this;
  var ticks = 0;
  function tick() {
    ticks++;
    if ( ticks !== 2 ) {
      return;
    }
    _this.emitEvent( 'fitComplete', [ _this, item ] );
  }
  
  item.on( 'layout', function() {
    tick();
    return true;
  });
  
  this.on( 'layoutComplete', function() {
    tick();
    return true;
  });
};
Packery.prototype.itemDragStart = function( elem ) {
  this.stamp( elem );
  var item = this.getItem( elem );
  if ( item ) {
    item.dragStart();
  }
};


Packery.prototype.itemDragMove = function( elem, x, y ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.dragMove( x, y );
  }
  var _this = this;
  
  function delayed() {
    _this.layout();
    delete _this.dragTimeout;
  }

  this.clearDragTimeout();

  this.dragTimeout = setTimeout( delayed, 40 );
};

Packery.prototype.clearDragTimeout = function() {
  if ( this.dragTimeout ) {
    clearTimeout( this.dragTimeout );
  }
};


Packery.prototype.itemDragEnd = function( elem ) {
  var item = this.getItem( elem );
  var itemDidDrag;
  if ( item ) {
    itemDidDrag = item.didDrag;
    item.dragStop();
  }
  if ( !item || ( !itemDidDrag && !item.needsPositioning ) ) {
    this.unstamp( elem );
    return;
  }
  classie.add( item.element, 'is-positioning-post-drag' );
  var onLayoutComplete = this._getDragEndLayoutComplete( elem, item );

  if ( item.needsPositioning ) {
    item.on( 'layout', onLayoutComplete );
    item.moveTo( item.placeRect.x, item.placeRect.y );
  } else if ( item ) {
    item.copyPlaceRectPosition();
  }

  this.clearDragTimeout();
  this.on( 'layoutComplete', onLayoutComplete );
  this.layout();

};


Packery.prototype._getDragEndLayoutComplete = function( elem, item ) {
  var itemNeedsPositioning = item && item.needsPositioning;
  var completeCount = 0;
  var asyncCount = itemNeedsPositioning ? 2 : 1;
  var _this = this;

  return function onLayoutComplete() {
    completeCount++;
    if ( completeCount !== asyncCount ) {
      return true;
    }
    if ( item ) {
      classie.remove( item.element, 'is-positioning-post-drag' );
      item.isPlacing = false;
      item.copyPlaceRectPosition();
    }

    _this.unstamp( elem );
    _this.sortItemsByPosition();
    if ( itemNeedsPositioning ) {
      _this.emitEvent( 'dragItemPositioned', [ _this, item ] );
    }
    return true;
  };
};


Packery.prototype.bindDraggabillyEvents = function( draggie ) {
  draggie.on( 'dragStart', this.handleDraggabilly.dragStart );
  draggie.on( 'dragMove', this.handleDraggabilly.dragMove );
  draggie.on( 'dragEnd', this.handleDraggabilly.dragEnd );
};


Packery.prototype.bindUIDraggableEvents = function( $elems ) {
  $elems
    .on( 'dragstart', this.handleUIDraggable.start )
    .on( 'drag', this.handleUIDraggable.drag )
    .on( 'dragstop', this.handleUIDraggable.stop );
};

Packery.Rect = Rect;
Packery.Packer = Packer;

return Packery;

}



if ( typeof define === 'function' && define.amd ) {
  
  define( [
      'classie/classie',
      'get-size/get-size',
      'outlayer/outlayer',
      './rect',
      './packer',
      './item'
    ],
    packeryDefinition );
} else {
  
  window.Packery = packeryDefinition(
    window.classie,
    window.getSize,
    window.Outlayer,
    window.Packery.Rect,
    window.Packery.Packer,
    window.Packery.Item
  );
}

})( window );
