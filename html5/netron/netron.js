Array.prototype.remove = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            this.splice(i, 1);
        }
    }
};
Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
};
var Netron;
(function (Netron) {
    var Connection = (function () {
        function Connection(from, to) {
            this._toPoint = null;
            this._from = from;
            this._to = to;
        }
        Object.defineProperty(Connection.prototype, "from", {
            get: function () {
                return this._from;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connection.prototype, "to", {
            get: function () {
                return this._to;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connection.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            set: function (value) {
                this._selected = value;
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connection.prototype, "hover", {
            get: function () {
                return this._hover;
            },
            set: function (value) {
                this._hover = value;
            },
            enumerable: true,
            configurable: true
        });
        Connection.prototype.updateToPoint = function (toPoint) {
            this._toPoint = toPoint;
        };
        Connection.prototype.remove = function () {
            this.invalidate();
            if ((this._from !== null) && (this._from.connections.contains(this))) {
                this._from.connections.remove(this);
            }
            if ((this._to !== null) && (this._to.connections.contains(this))) {
                this._to.connections.remove(this);
            }
            this._from = null;
            this._to = null;
        };
        Connection.prototype.insert = function (from, to) {
            this._from = from;
            this._to = to;
            this._from.connections.push(this);
            this._from.invalidate();
            this._to.connections.push(this);
            this._to.invalidate();
            this.invalidate();
        };
        Connection.prototype.getCursor = function (point) {
            return Netron.Cursors.select;
        };
        Connection.prototype.hitTest = function (rectangle) {
            if ((this.from !== null) && (this.to !== null)) {
                var p1 = this.from.element.getConnectorPosition(this.from);
                var p2 = this.to.element.getConnectorPosition(this.to);
                if ((rectangle.width !== 0) || (rectangle.height !== 0)) {
                    return (rectangle.contains(p1) && rectangle.contains(p2));
                }
                var p = rectangle.topLeft;
                // p1 must be the leftmost point
                if (p1.x > p2.x) {
                    var temp = p2;
                    p2 = p1;
                    p1 = temp;
                }
                var r1 = new Netron.Rectangle(p1.x, p1.y, 0, 0);
                var r2 = new Netron.Rectangle(p2.x, p2.y, 0, 0);
                r1.inflate(3, 3);
                r2.inflate(3, 3);
                if (r1.union(r2).contains(p)) {
                    if ((p1.x == p2.x) || (p1.y == p2.y)) {
                        return true;
                    }
                    else if (p1.y < p2.y) {
                        var o1 = r1.x + (((r2.x - r1.x) * (p.y - (r1.y + r1.height))) / ((r2.y + r2.height) - (r1.y + r1.height)));
                        var u1 = (r1.x + r1.width) + ((((r2.x + r2.width) - (r1.x + r1.width)) * (p.y - r1.y)) / (r2.y - r1.y));
                        return ((p.x > o1) && (p.x < u1));
                    }
                    else {
                        var o2 = r1.x + (((r2.x - r1.x) * (p.y - r1.y)) / (r2.y - r1.y));
                        var u2 = (r1.x + r1.width) + ((((r2.x + r2.width) - (r1.x + r1.width)) * (p.y - (r1.y + r1.height))) / ((r2.y + r2.height) - (r1.y + r1.height)));
                        return ((p.x > o2) && (p.x < u2));
                    }
                }
            }
            return false;
        };
        Connection.prototype.invalidate = function () {
            if (this._from !== null) {
                this._from.invalidate();
            }
            if (this._to !== null) {
                this._to.invalidate();
            }
        };
        Connection.prototype.paint = function (context) {
            context.strokeStyle = this._from.element.graph.theme.connection;
            context.lineWidth = (this._hover) ? 2 : 1;
            this.paintLine(context, this._selected);
        };
        Connection.prototype.paintTrack = function (context) {
            context.strokeStyle = this.from.element.graph.theme.connection;
            context.lineWidth = 1;
            this.paintLine(context, true);
        };
        Connection.prototype.paintLine = function (context, dashed) {
            if (this._from !== null) {
                var start = this._from.element.getConnectorPosition(this.from);
                var end = (this._to !== null) ? this._to.element.getConnectorPosition(this.to) : this._toPoint;
                if ((start.x != end.x) || (start.y != end.y)) {
                    context.beginPath();
                    if (dashed) {
                        Netron.LineHelper.dashedLine(context, start.x, start.y, end.x, end.y);
                    }
                    else {
                        context.moveTo(start.x - 0.5, start.y - 0.5);
                        context.lineTo(end.x - 0.5, end.y - 0.5);
                    }
                    context.closePath();
                    context.stroke();
                }
            }
        };
        return Connection;
    })();
    Netron.Connection = Connection;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Connector = (function () {
        function Connector(element, template) {
            this._connections = [];
            this._hover = false;
            this._element = element;
            this._template = template;
        }
        Connector.prototype.getRectangle = function () {
            var point = this._element.getConnectorPosition(this);
            var rectangle = new Netron.Rectangle(point.x, point.y, 0, 0);
            rectangle.inflate(3, 3);
            return rectangle;
        };
        Object.defineProperty(Connector.prototype, "element", {
            get: function () {
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "template", {
            get: function () {
                return this._template;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "connections", {
            get: function () {
                return this._connections;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Connector.prototype, "hover", {
            get: function () {
                return this._hover;
            },
            set: function (value) {
                this._hover = value;
            },
            enumerable: true,
            configurable: true
        });
        Connector.prototype.getCursor = function (point) {
            return Netron.Cursors.grip;
        };
        Connector.prototype.hitTest = function (rectangle) {
            if ((rectangle.width === 0) && (rectangle.height === 0)) {
                return this.getRectangle().contains(rectangle.topLeft);
            }
            return rectangle.contains(this.getRectangle().topLeft);
        };
        Connector.prototype.invalidate = function () {
        };
        Connector.prototype.isAssignable = function (connector) {
            if (connector === this) {
                return false;
            }
            var t1 = this._template.type.split(' ');
            if (!t1.contains("[array]") && (this._connections.length == 1)) {
                return false;
            }
            if (connector instanceof Connector) {
                var t2 = connector._template.type.split(' ');
                if ((t1[0] != t2[0]) ||
                    (this._element == connector.element) ||
                    (t1.contains("[in]") && !t2.contains("[out]")) ||
                    (t1.contains("[out]") && !t2.contains("[in]")) ||
                    (!t2.contains("[array]") && (connector.connections.length == 1))) {
                    return false;
                }
            }
            return true;
        };
        Connector.prototype.paint = function (context, other) {
            var rectangle = this.getRectangle();
            var strokeStyle = this._element.graph.theme.connectorBorder;
            var fillStyle = this._element.graph.theme.connector;
            if (this._hover) {
                strokeStyle = this._element.graph.theme.connectorHoverBorder;
                fillStyle = this._element.graph.theme.connectorHover;
                if (!this.isAssignable(other)) {
                    fillStyle = "#f00";
                }
            }
            context.lineWidth = 1;
            context.strokeStyle = strokeStyle;
            context.lineCap = "butt";
            context.fillStyle = fillStyle;
            context.fillRect(rectangle.x - 0.5, rectangle.y - 0.5, rectangle.width, rectangle.height);
            context.strokeRect(rectangle.x - 0.5, rectangle.y - 0.5, rectangle.width, rectangle.height);
            if (this._hover) {
                // Tooltip
                var text = ("description" in this._template) ? this._template.description : this._template.name;
                context.textBaseline = "bottom";
                context.font = "8.25pt Tahoma";
                var size = context.measureText(text);
                var sizeHeight = 14;
                var sizeWidth = size.width;
                var a = new Netron.Rectangle(rectangle.x - Math.floor(size.width / 2), rectangle.y + sizeHeight + 6, sizeWidth, sizeHeight);
                var b = new Netron.Rectangle(a.x, a.y, a.width, a.height);
                a.inflate(4, 1);
                context.fillStyle = "rgb(255, 255, 231)";
                context.fillRect(a.x - 0.5, a.y - 0.5, a.width, a.height);
                context.strokeStyle = "#000";
                context.lineWidth = 1;
                context.strokeRect(a.x - 0.5, a.y - 0.5, a.width, a.height);
                context.fillStyle = "#000";
                context.fillText(text, b.x, b.y + 13);
            }
        };
        return Connector;
    })();
    Netron.Connector = Connector;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var ContainerUndoUnit = (function () {
        function ContainerUndoUnit() {
            this._undoUnits = [];
        }
        ContainerUndoUnit.prototype.add = function (undoUnit) {
            this._undoUnits.push(undoUnit);
        };
        ContainerUndoUnit.prototype.undo = function () {
            for (var i = 0; i < this._undoUnits.length; i++) {
                this._undoUnits[i].undo();
            }
        };
        ContainerUndoUnit.prototype.redo = function () {
            for (var i = 0; i < this._undoUnits.length; i++) {
                this._undoUnits[i].redo();
            }
        };
        Object.defineProperty(ContainerUndoUnit.prototype, "isEmpty", {
            get: function () {
                if (this._undoUnits.length > 0) {
                    for (var i = 0; i < this._undoUnits.length; i++) {
                        if (!this._undoUnits[i].isEmpty) {
                            return false;
                        }
                    }
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        return ContainerUndoUnit;
    })();
    Netron.ContainerUndoUnit = ContainerUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var ContentChangedUndoUnit = (function () {
        function ContentChangedUndoUnit(element, content) {
            this._element = element;
            this._undoContent = element.content;
            this._redoContent = content;
        }
        ContentChangedUndoUnit.prototype.undo = function () {
            this._element.content = this._undoContent;
        };
        ContentChangedUndoUnit.prototype.redo = function () {
            this._element.content = this._redoContent;
        };
        Object.defineProperty(ContentChangedUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return ContentChangedUndoUnit;
    })();
    Netron.ContentChangedUndoUnit = ContentChangedUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Cursors = (function () {
        function Cursors() {
        }
        Cursors.arrow = "default";
        Cursors.grip = "pointer"; // "crosshair", 
        Cursors.cross = "pointer"; // "crosshair",
        Cursors.add = "pointer";
        Cursors.move = "move";
        Cursors.select = "pointer";
        return Cursors;
    })();
    Netron.Cursors = Cursors;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var DeleteConnectionUndoUnit = (function () {
        function DeleteConnectionUndoUnit(connection) {
            this._connection = connection;
            this._from = connection.from;
            this._to = connection.to;
        }
        DeleteConnectionUndoUnit.prototype.undo = function () {
            this._connection.insert(this._from, this._to);
        };
        DeleteConnectionUndoUnit.prototype.redo = function () {
            this._connection.remove();
        };
        Object.defineProperty(DeleteConnectionUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return DeleteConnectionUndoUnit;
    })();
    Netron.DeleteConnectionUndoUnit = DeleteConnectionUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var DeleteElementUndoUnit = (function () {
        function DeleteElementUndoUnit(element) {
            this._element = element;
            this._graph = element.graph;
        }
        DeleteElementUndoUnit.prototype.undo = function () {
            this._element.insertInto(this._graph);
        };
        DeleteElementUndoUnit.prototype.redo = function () {
            this._element.remove();
        };
        Object.defineProperty(DeleteElementUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return DeleteElementUndoUnit;
    })();
    Netron.DeleteElementUndoUnit = DeleteElementUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Element = (function () {
        function Element(template, point) {
            this._graph = null;
            this._hover = false;
            this._selected = false;
            this._tracker = null;
            this._connectors = [];
            this._template = template;
            this._content = template.defaultContent;
            this._rectangle = new Netron.Rectangle(point.x, point.y, template.defaultWidth, template.defaultHeight);
            for (var i = 0; i < template.connectorTemplates.length; i++) {
                var connectorTemplate = template.connectorTemplates[i];
                this._connectors.push(new Netron.Connector(this, connectorTemplate));
            }
        }
        Object.defineProperty(Element.prototype, "rectangle", {
            get: function () {
                return ((this._tracker !== null) && (this._tracker.track)) ? this._tracker.rectangle : this._rectangle;
            },
            set: function (value) {
                this.invalidate();
                this._rectangle = value;
                if (this._tracker !== null) {
                    this._tracker.updateRectangle(value);
                }
                this.invalidate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "template", {
            get: function () {
                return this._template;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "graph", {
            get: function () {
                return this._graph;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "connectors", {
            get: function () {
                return this._connectors;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "tracker", {
            get: function () {
                return this._tracker;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            set: function (value) {
                this._selected = value;
                if (this._selected) {
                    this._tracker = new Netron.Tracker(this._rectangle, ("resizable" in this._template) ? this._template.resizable : false);
                    this.invalidate();
                }
                else {
                    this.invalidate();
                    this._tracker = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Element.prototype, "hover", {
            get: function () {
                return this._hover;
            },
            set: function (value) {
                this._hover = value;
            },
            enumerable: true,
            configurable: true
        });
        Element.prototype.paint = function (context) {
            this._template.paint(this, context);
            if (this._selected) {
                this._tracker.paint(context);
            }
        };
        Element.prototype.invalidate = function () {
        };
        Element.prototype.insertInto = function (graph) {
            this._graph = graph;
            this._graph.elements.push(this);
        };
        Element.prototype.remove = function () {
            this.invalidate();
            for (var i = 0; i < this._connectors.length; i++) {
                var connections = this._connectors[i].connections;
                for (var j = 0; j < connections.length; j++) {
                    connections[j].remove();
                }
            }
            if ((this._graph !== null) && (this._graph.elements.contains(this))) {
                this._graph.elements.remove(this);
            }
            this._graph = null;
        };
        Element.prototype.hitTest = function (rectangle) {
            if ((rectangle.width === 0) && (rectangle.height === 0)) {
                if (this._rectangle.contains(rectangle.topLeft)) {
                    return true;
                }
                if ((this._tracker !== null) && (this._tracker.track)) {
                    var h = this._tracker.hitTest(rectangle.topLeft);
                    if ((h.x >= -1) && (h.x <= +1) && (h.y >= -1) && (h.y <= +1)) {
                        return true;
                    }
                }
                for (var i = 0; i < this._connectors.length; i++) {
                    if (this._connectors[i].hitTest(rectangle)) {
                        return true;
                    }
                }
                return false;
            }
            return rectangle.contains(this._rectangle.topLeft);
        };
        Element.prototype.getCursor = function (point) {
            if (this._tracker !== null) {
                var cursor = this._tracker.getCursor(point);
                if (cursor !== null) {
                    return cursor;
                }
            }
            if (window.event.shiftKey) {
                return Netron.Cursors.add;
            }
            return Netron.Cursors.select;
        };
        Element.prototype.getConnector = function (name) {
            for (var i = 0; i < this._connectors.length; i++) {
                var connector = this._connectors[i];
                if (connector.template.name == name) {
                    return connector;
                }
            }
            return null;
        };
        Element.prototype.getConnectorPosition = function (connector) {
            var rectangle = this.rectangle;
            var point = connector.template.getConnectorPosition(this);
            point.x += rectangle.x;
            point.y += rectangle.y;
            return point;
        };
        Element.prototype.setContent = function (content) {
            this._graph.setElementContent(this, content);
        };
        Object.defineProperty(Element.prototype, "content", {
            get: function () {
                return this._content;
            },
            set: function (value) {
                this._content = value;
            },
            enumerable: true,
            configurable: true
        });
        return Element;
    })();
    Netron.Element = Element;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Graph = (function () {
        function Graph(element) {
            var _this = this;
            this._pointerPosition = new Netron.Point(0, 0);
            this._shiftKey = false;
            this._undoService = new Netron.UndoService();
            this._elements = [];
            this._activeTemplate = null;
            this._activeObject = null;
            this._newElement = null;
            this._newConnection = null;
            this._selection = null;
            this._track = false;
            this._canvas = element;
            this._canvas.width = this._canvas.clientWidth * this.devicePixelRatio;
            this._canvas.height = this._canvas.clientHeight * this.devicePixelRatio;
            this._canvas.focus();
            this._context = this._canvas.getContext("2d");
            this._context.scale(this.devicePixelRatio, this.devicePixelRatio);
            this._theme = { background: "#fff", connection: "#000", selection: "#000", connector: "#31456b", connectorBorder: "#fff", connectorHoverBorder: "#000", connectorHover: "#0c0" };
            this._isWebKit = typeof navigator.userAgent.split("WebKit/")[1] !== "undefined";
            this._isMozilla = navigator.appVersion.indexOf('Gecko/') >= 0 || ((navigator.userAgent.indexOf("Gecko") >= 0) && !this._isWebKit && (typeof navigator.appVersion !== "undefined"));
            this._mouseDownHandler = function (e) { _this.mouseDown(e); };
            this._mouseUpHandler = function (e) { _this.mouseUp(e); };
            this._mouseMoveHandler = function (e) { _this.mouseMove(e); };
            this._doubleClickHandler = function (e) { _this.doubleClick(e); };
            this._touchStartHandler = function (e) { _this.touchStart(e); };
            this._touchEndHandler = function (e) { _this.touchEnd(e); };
            this._touchMoveHandler = function (e) { _this.touchMove(e); };
            this._keyDownHandler = function (e) { _this.keyDown(e); };
            this._keyPressHandler = function (e) { _this.keyPress(e); };
            this._keyUpHandler = function (e) { _this.keyUp(e); };
            this._canvas.addEventListener("mousedown", this._mouseDownHandler, false);
            this._canvas.addEventListener("mouseup", this._mouseUpHandler, false);
            this._canvas.addEventListener("mousemove", this._mouseMoveHandler, false);
            this._canvas.addEventListener("touchstart", this._touchStartHandler, false);
            this._canvas.addEventListener("touchend", this._touchEndHandler, false);
            this._canvas.addEventListener("touchmove", this._touchMoveHandler, false);
            this._canvas.addEventListener("dblclick", this._doubleClickHandler, false);
            this._canvas.addEventListener("keydown", this._keyDownHandler, false);
            this._canvas.addEventListener("keypress", this._keyPressHandler, false);
            this._canvas.addEventListener("keyup", this._keyUpHandler, false);
        }
        Graph.prototype.dispose = function () {
            if (this._canvas !== null) {
                this._canvas.removeEventListener("mousedown", this._mouseDownHandler);
                this._canvas.removeEventListener("mouseup", this._mouseUpHandler);
                this._canvas.removeEventListener("mousemove", this._mouseMoveHandler);
                this._canvas.removeEventListener("dblclick", this._doubleClickHandler);
                this._canvas.removeEventListener("touchstart", this._touchStartHandler);
                this._canvas.removeEventListener("touchend", this._touchEndHandler);
                this._canvas.removeEventListener("touchmove", this._touchMoveHandler);
                this._canvas.removeEventListener("keydown", this._keyDownHandler);
                this._canvas.removeEventListener("keypress", this._keyPressHandler);
                this._canvas.removeEventListener("keyup", this._keyUpHandler);
                this._canvas = null;
                this._context = null;
            }
        };
        Object.defineProperty(Graph.prototype, "theme", {
            get: function () {
                return this._theme;
            },
            set: function (value) {
                this._theme = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Graph.prototype, "elements", {
            get: function () {
                return this._elements;
            },
            enumerable: true,
            configurable: true
        });
        Graph.prototype.addElement = function (template, point, content) {
            this._activeTemplate = template;
            var element = new Netron.Element(template, point);
            element.content = content;
            element.insertInto(this);
            element.invalidate();
            return element;
        };
        Graph.prototype.createElement = function (template) {
            this._activeTemplate = template;
            this._newElement = new Netron.Element(template, this._pointerPosition);
            this.update();
            this._canvas.focus();
        };
        Graph.prototype.addConnection = function (connector1, connector2) {
            var connection = new Netron.Connection(connector1, connector2);
            connector1.connections.push(connection);
            connector2.connections.push(connection);
            connector1.invalidate();
            connector2.invalidate();
            connection.invalidate();
            return connection;
        };
        Graph.prototype.setElementContent = function (element, content) {
            this._undoService.begin();
            this._undoService.add(new Netron.ContentChangedUndoUnit(element, content));
            this._undoService.commit();
            this.update();
        };
        Graph.prototype.deleteSelection = function () {
            this._undoService.begin();
            var deletedConnections = [];
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    for (var k = 0; k < connector.connections.length; k++) {
                        var connection = connector.connections[k];
                        if ((element.selected || connection.selected) && (!deletedConnections.contains(connection))) {
                            this._undoService.add(new Netron.DeleteConnectionUndoUnit(connection));
                            deletedConnections.push(connection);
                        }
                    }
                }
            }
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                if (element.selected) {
                    this._undoService.add(new Netron.DeleteElementUndoUnit(element));
                }
            }
            this._undoService.commit();
        };
        Object.defineProperty(Graph.prototype, "devicePixelRatio", {
            get: function () {
                return (('devicePixelRatio' in window) && (window.devicePixelRatio > 1)) ? window.devicePixelRatio : 1;
            },
            enumerable: true,
            configurable: true
        });
        Graph.prototype.mouseDown = function (e) {
            e.preventDefault();
            this._canvas.focus();
            this.updateMousePosition(e);
            if (e.button === 0) {
                // alt+click allows fast creation of element using the active template
                if ((this._newElement === null) && (e.altKey)) {
                    this.createElement(this._activeTemplate);
                }
                this.pointerDown();
            }
        };
        Graph.prototype.mouseUp = function (e) {
            e.preventDefault();
            this.updateMousePosition(e);
            if (e.button === 0) {
                this.pointerUp();
            }
        };
        Graph.prototype.mouseMove = function (e) {
            e.preventDefault();
            this.updateMousePosition(e);
            this.pointerMove();
        };
        Graph.prototype.doubleClick = function (e) {
            e.preventDefault();
            this.updateMousePosition(e);
            if (e.button === 0) {
                var point = this._pointerPosition;
                this.updateActiveObject(point);
                if ((this._activeObject !== null) && (this._activeObject instanceof Netron.Element)) {
                    var element = this._activeObject;
                    if ((element.template !== null) && ("edit" in element.template)) {
                        element.template.edit(element, this._context, point);
                        this.update();
                    }
                }
            }
        };
        Graph.prototype.touchStart = function (e) {
            if (e.touches.length == 1) {
                e.preventDefault();
                this.updateTouchPosition(e);
                this.pointerDown();
            }
        };
        Graph.prototype.touchEnd = function (e) {
            e.preventDefault();
            this.pointerUp();
        };
        Graph.prototype.touchMove = function (e) {
            if (e.touches.length == 1) {
                e.preventDefault();
                this.updateTouchPosition(e);
                this.pointerMove();
            }
        };
        Graph.prototype.pointerDown = function () {
            var point = this._pointerPosition;
            if (this._newElement !== null) {
                this._undoService.begin();
                this._newElement.invalidate();
                this._newElement.rectangle = new Netron.Rectangle(point.x, point.y, this._newElement.rectangle.width, this._newElement.rectangle.height);
                this._newElement.invalidate();
                this._undoService.add(new Netron.InsertElementUndoUnit(this._newElement, this));
                this._undoService.commit();
                this._newElement = null;
            }
            else {
                this._selection = null;
                this.updateActiveObject(point);
                if (this._activeObject === null) {
                    // start selection
                    this._selection = new Netron.Selection(point);
                }
                else {
                    // start connection
                    if ((this._activeObject instanceof Netron.Connector) && (!this._shiftKey)) {
                        var connector = this._activeObject;
                        if (connector.isAssignable(null)) {
                            this._newConnection = new Netron.Connection(connector, null);
                            this._newConnection.updateToPoint(point);
                            connector.invalidate();
                        }
                    }
                    else {
                        // select object
                        var selectable = this._activeObject;
                        if (!selectable.selected) {
                            this._undoService.begin();
                            var selectionUndoUnit = new Netron.SelectionUndoUnit();
                            if (!this._shiftKey) {
                                this.deselectAll(selectionUndoUnit);
                            }
                            selectionUndoUnit.select(selectable);
                            this._undoService.add(selectionUndoUnit);
                            this._undoService.commit();
                        }
                        else if (this._shiftKey) {
                            this._undoService.begin();
                            var deselectUndoUnit = new Netron.SelectionUndoUnit();
                            deselectUndoUnit.deselect(selectable);
                            this._undoService.add(deselectUndoUnit);
                            this._undoService.commit();
                        }
                        // start tracking
                        var hit = new Netron.Point(0, 0);
                        if (this._activeObject instanceof Netron.Element) {
                            var element = this._activeObject;
                            hit = element.tracker.hitTest(point);
                        }
                        for (var i = 0; i < this._elements.length; i++) {
                            var element = this._elements[i];
                            if (element.tracker !== null) {
                                element.tracker.start(point, hit);
                            }
                        }
                        this._track = true;
                    }
                }
            }
            this.update();
            this.updateMouseCursor();
        };
        Graph.prototype.pointerUp = function () {
            var point = this._pointerPosition;
            if (this._newConnection !== null) {
                this.updateActiveObject(point);
                this._newConnection.invalidate();
                if ((this._activeObject !== null) && (this._activeObject instanceof Netron.Connector)) {
                    var connector = this._activeObject;
                    if ((connector != this._newConnection.from) && (connector.isAssignable(this._newConnection.from))) {
                        this._undoService.begin();
                        this._undoService.add(new Netron.InsertConnectionUndoUnit(this._newConnection, this._newConnection.from, connector));
                        this._undoService.commit();
                    }
                }
                this._newConnection = null;
            }
            if (this._selection !== null) {
                this._undoService.begin();
                var selectionUndoUnit = new Netron.SelectionUndoUnit();
                var rectangle = this._selection.rectangle;
                var selectable = this._activeObject;
                if ((this._activeObject === null) || (!selectable.selected)) {
                    if (!this._shiftKey) {
                        this.deselectAll(selectionUndoUnit);
                    }
                }
                if ((rectangle.width !== 0) || (rectangle.height !== 0)) {
                    this.selectAll(selectionUndoUnit, rectangle);
                }
                this._undoService.add(selectionUndoUnit);
                this._undoService.commit();
                this._selection = null;
            }
            if (this._track) {
                this._undoService.begin();
                for (var i = 0; i < this._elements.length; i++) {
                    var element = this._elements[i];
                    if (element.tracker !== null) {
                        element.tracker.stop();
                        element.invalidate();
                        var r1 = element.rectangle;
                        var r2 = element.tracker.rectangle;
                        if ((r1.x != r2.x) || (r1.y != r2.y) || (r1.width != r2.width) || (r1.height != r2.height)) {
                            this._undoService.add(new Netron.TransformUndoUnit(element, r1, r2));
                        }
                    }
                }
                this._undoService.commit();
                this._track = false;
                this.updateActiveObject(point);
            }
            this.update();
            this.updateMouseCursor();
        };
        Graph.prototype.pointerMove = function () {
            var point = this._pointerPosition;
            if (this._newElement !== null) {
                // placing new element
                this._newElement.invalidate();
                this._newElement.rectangle = new Netron.Rectangle(point.x, point.y, this._newElement.rectangle.width, this._newElement.rectangle.height);
                this._newElement.invalidate();
            }
            if (this._track) {
                // moving selected elements
                for (var i = 0; i < this._elements.length; i++) {
                    var element = this._elements[i];
                    if (element.tracker !== null) {
                        element.invalidate();
                        element.tracker.move(point);
                        element.invalidate();
                    }
                }
            }
            if (this._newConnection !== null) {
                // connecting two connectors
                this._newConnection.invalidate();
                this._newConnection.updateToPoint(point);
                this._newConnection.invalidate();
            }
            if (this._selection !== null) {
                this._selection.updateCurrentPoint(point);
            }
            this.updateActiveObject(point);
            this.update();
            this.updateMouseCursor();
        };
        Graph.prototype.keyDown = function (e) {
            if (!this._isMozilla) {
                this.processKey(e, e.keyCode);
            }
        };
        Graph.prototype.keyPress = function (e) {
            if (this._isMozilla) {
                if (typeof this._keyCodeTable === "undefined") {
                    this._keyCodeTable = [];
                    var charCodeTable = {
                        32: ' ', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 59: ';', 61: '=',
                        65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
                        107: '+', 109: '-', 110: '.', 188: ',', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: '\"'
                    };
                    for (var keyCode in charCodeTable) {
                        var key = charCodeTable[keyCode];
                        this._keyCodeTable[key.charCodeAt(0)] = keyCode;
                        if (key.toUpperCase() != key) {
                            this._keyCodeTable[key.toUpperCase().charCodeAt(0)] = keyCode;
                        }
                    }
                }
                this.processKey(e, (this._keyCodeTable[e.charCode]) ? this._keyCodeTable[e.charCode] : e.keyCode);
            }
        };
        Graph.prototype.keyUp = function (e) {
            this.updateMouseCursor();
        };
        Graph.prototype.processKey = function (e, keyCode) {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if (keyCode == 65) {
                    this._undoService.begin();
                    var selectionUndoUnit = new Netron.SelectionUndoUnit();
                    this.selectAll(selectionUndoUnit, null);
                    this._undoService.add(selectionUndoUnit);
                    this._undoService.commit();
                    this.update();
                    this.updateActiveObject(this._pointerPosition);
                    this.updateMouseCursor();
                    this.stopEvent(e);
                }
                if ((keyCode == 90) && (!e.shiftKey)) {
                    this._undoService.undo();
                    this.update();
                    this.updateActiveObject(this._pointerPosition);
                    this.updateMouseCursor();
                    this.stopEvent(e);
                }
                if (((keyCode == 90) && (e.shiftKey)) || (keyCode == 89)) {
                    this._undoService.redo();
                    this.update();
                    this.updateActiveObject(this._pointerPosition);
                    this.updateMouseCursor();
                    this.stopEvent(e);
                }
            }
            if ((keyCode == 46) || (keyCode == 8)) {
                this.deleteSelection();
                this.update();
                this.updateActiveObject(this._pointerPosition);
                this.updateMouseCursor();
                this.stopEvent(e);
            }
            if (keyCode == 27) {
                this._newElement = null;
                this._newConnection = null;
                this._track = false;
                for (var i = 0; i < this._elements.length; i++) {
                    var element = this._elements[i];
                    if (element.tracker !== null) {
                        element.tracker.stop();
                    }
                }
                this.update();
                this.updateActiveObject(this._pointerPosition);
                this.updateMouseCursor();
                this.stopEvent(e);
            }
        };
        Graph.prototype.stopEvent = function (e) {
            e.preventDefault();
            e.stopPropagation();
        };
        Graph.prototype.selectAll = function (selectionUndoUnit, rectangle) {
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                if ((rectangle === null) || (element.hitTest(rectangle))) {
                    selectionUndoUnit.select(element);
                }
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    for (var k = 0; k < connector.connections.length; k++) {
                        var connection = connector.connections[k];
                        if ((rectangle === null) || (connection.hitTest(rectangle))) {
                            selectionUndoUnit.select(connection);
                        }
                    }
                }
            }
        };
        Graph.prototype.deselectAll = function (selectionUndoUnit) {
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                selectionUndoUnit.deselect(element);
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    for (var k = 0; k < connector.connections.length; k++) {
                        var connection = connector.connections[k];
                        selectionUndoUnit.deselect(connection);
                    }
                }
            }
        };
        Graph.prototype.updateActiveObject = function (point) {
            var hitObject = this.hitTest(point);
            if (hitObject != this._activeObject) {
                if (this._activeObject !== null) {
                    this._activeObject.hover = false;
                }
                this._activeObject = hitObject;
                if (this._activeObject !== null) {
                    this._activeObject.hover = true;
                }
            }
        };
        Graph.prototype.hitTest = function (point) {
            var rectangle = new Netron.Rectangle(point.x, point.y, 0, 0);
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    if (connector.hitTest(rectangle)) {
                        return connector;
                    }
                }
            }
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                if (element.hitTest(rectangle)) {
                    return element;
                }
            }
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    for (var k = 0; k < connector.connections.length; k++) {
                        var connection = connector.connections[k];
                        if (connection.hitTest(rectangle)) {
                            return connection;
                        }
                    }
                }
            }
            return null;
        };
        Graph.prototype.updateMouseCursor = function () {
            if (this._newConnection !== null) {
                this._canvas.style.cursor = ((this._activeObject !== null) && (this._activeObject instanceof Netron.Connector)) ? this._activeObject.getCursor(this._pointerPosition) : Netron.Cursors.cross;
            }
            else {
                this._canvas.style.cursor = (this._activeObject !== null) ? this._activeObject.getCursor(this._pointerPosition) : Netron.Cursors.arrow;
            }
        };
        Graph.prototype.updateMousePosition = function (e) {
            this._shiftKey = e.shiftKey;
            this._pointerPosition = new Netron.Point(e.pageX, e.pageY);
            var node = this._canvas;
            while (node !== null) {
                this._pointerPosition.x -= node.offsetLeft;
                this._pointerPosition.y -= node.offsetTop;
                node = node.offsetParent;
            }
        };
        Graph.prototype.updateTouchPosition = function (e) {
            this._shiftKey = false;
            this._pointerPosition = new Netron.Point(e.touches[0].pageX, e.touches[0].pageY);
            var node = this._canvas;
            while (node !== null) {
                this._pointerPosition.x -= node.offsetLeft;
                this._pointerPosition.y -= node.offsetTop;
                node = node.offsetParent;
            }
        };
        Graph.prototype.update = function () {
            this._canvas.style.background = this.theme.background;
            this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            var connections = [];
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    for (var k = 0; k < connector.connections.length; k++) {
                        var connection = connector.connections[k];
                        if (!connections.contains(connection)) {
                            connection.paint(this._context);
                            connections.push(connection);
                        }
                    }
                }
            }
            for (var i = 0; i < this._elements.length; i++) {
                this._context.save();
                this._elements[i].paint(this._context);
                this._context.restore();
            }
            for (var i = 0; i < this._elements.length; i++) {
                var element = this._elements[i];
                for (var j = 0; j < element.connectors.length; j++) {
                    var connector = element.connectors[j];
                    var hover = false;
                    for (var k = 0; k < connector.connections.length; k++) {
                        if (connector.connections[k].hover) {
                            hover = true;
                        }
                    }
                    if ((element.hover) || (connector.hover) || hover) {
                        connector.paint(this._context, (this._newConnection !== null) ? this._newConnection.from : null);
                    }
                    else if ((this._newConnection !== null) && (connector.isAssignable(this._newConnection.from))) {
                        connector.paint(this._context, this._newConnection.from);
                    }
                }
            }
            if (this._newElement !== null) {
                this._context.save();
                this._newElement.paint(this._context);
                this._context.restore();
            }
            if (this._newConnection !== null) {
                this._newConnection.paintTrack(this._context);
            }
            if (this._selection !== null) {
                this._context.strokeStyle = this.theme.selection;
                this._selection.paint(this._context);
            }
        };
        return Graph;
    })();
    Netron.Graph = Graph;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var InsertConnectionUndoUnit = (function () {
        function InsertConnectionUndoUnit(connection, from, to) {
            this._connection = connection;
            this._from = from;
            this._to = to;
        }
        InsertConnectionUndoUnit.prototype.undo = function () {
            this._connection.remove();
        };
        InsertConnectionUndoUnit.prototype.redo = function () {
            this._connection.insert(this._from, this._to);
        };
        Object.defineProperty(InsertConnectionUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return InsertConnectionUndoUnit;
    })();
    Netron.InsertConnectionUndoUnit = InsertConnectionUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var InsertElementUndoUnit = (function () {
        function InsertElementUndoUnit(element, graph) {
            this._element = element;
            this._graph = graph;
        }
        InsertElementUndoUnit.prototype.undo = function () {
            this._element.remove();
        };
        InsertElementUndoUnit.prototype.redo = function () {
            this._element.insertInto(this._graph);
        };
        Object.defineProperty(InsertElementUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return InsertElementUndoUnit;
    })();
    Netron.InsertElementUndoUnit = InsertElementUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var LineHelper = (function () {
        function LineHelper() {
        }
        LineHelper.dashedLine = function (context, x1, y1, x2, y2) {
            context.moveTo(x1, y1);
            var dx = x2 - x1;
            var dy = y2 - y1;
            var count = Math.floor(Math.sqrt(dx * dx + dy * dy) / 3); // dash length
            var ex = dx / count;
            var ey = dy / count;
            var q = 0;
            while (q++ < count) {
                x1 += ex;
                y1 += ey;
                if (q % 2 === 0) {
                    context.moveTo(x1, y1);
                }
                else {
                    context.lineTo(x1, y1);
                }
            }
            if (q % 2 === 0) {
                context.moveTo(x2, y2);
            }
            else {
                context.lineTo(x2, y2);
            }
        };
        return LineHelper;
    })();
    Netron.LineHelper = LineHelper;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    })();
    Netron.Point = Point;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Rectangle = (function () {
        function Rectangle(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Rectangle.prototype.contains = function (point) {
            return ((point.x >= this.x) && (point.x <= (this.x + this.width)) && (point.y >= this.y) && (point.y <= (this.y + this.height)));
        };
        Rectangle.prototype.inflate = function (dx, dy) {
            this.x -= dx;
            this.y -= dy;
            this.width += dx + dx + 1;
            this.height += dy + dy + 1;
        };
        Rectangle.prototype.union = function (rectangle) {
            var x1 = (this.x < rectangle.x) ? this.x : rectangle.x;
            var y1 = (this.y < rectangle.y) ? this.y : rectangle.y;
            var x2 = ((this.x + this.width) < (rectangle.x + rectangle.width)) ? (rectangle.x + rectangle.width) : (this.x + this.width);
            var y2 = ((this.y + this.height) < (rectangle.y + rectangle.height)) ? (rectangle.y + rectangle.height) : (this.y + this.height);
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        };
        Object.defineProperty(Rectangle.prototype, "topLeft", {
            get: function () {
                return new Netron.Point(this.x, this.y);
            },
            enumerable: true,
            configurable: true
        });
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        return Rectangle;
    })();
    Netron.Rectangle = Rectangle;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Selection = (function () {
        function Selection(startPoint) {
            this._startPoint = startPoint;
            this._currentPoint = startPoint;
        }
        Object.defineProperty(Selection.prototype, "rectangle", {
            get: function () {
                var rectangle = new Netron.Rectangle((this._startPoint.x <= this._currentPoint.x) ? this._startPoint.x : this._currentPoint.x, (this._startPoint.y <= this._currentPoint.y) ? this._startPoint.y : this._currentPoint.y, this._currentPoint.x - this._startPoint.x, this._currentPoint.y - this._startPoint.y);
                if (rectangle.width < 0) {
                    rectangle.width *= -1;
                }
                if (rectangle.height < 0) {
                    rectangle.height *= -1;
                }
                return rectangle;
            },
            enumerable: true,
            configurable: true
        });
        Selection.prototype.updateCurrentPoint = function (currentPoint) {
            this._currentPoint = currentPoint;
        };
        Selection.prototype.paint = function (context) {
            var r = this.rectangle;
            context.lineWidth = 1;
            context.beginPath();
            Netron.LineHelper.dashedLine(context, r.x - 0.5, r.y - 0.5, r.x - 0.5 + r.width, r.y - 0.5);
            Netron.LineHelper.dashedLine(context, r.x - 0.5 + r.width, r.y - 0.5, r.x - 0.5 + r.width, r.y - 0.5 + r.height);
            Netron.LineHelper.dashedLine(context, r.x - 0.5 + r.width, r.y - 0.5 + r.height, r.x - 0.5, r.y - 0.5 + r.height);
            Netron.LineHelper.dashedLine(context, r.x - 0.5, r.y - 0.5 + r.height, r.x - 0.5, r.y - 0.5);
            context.closePath();
            context.stroke();
        };
        return Selection;
    })();
    Netron.Selection = Selection;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var SelectionUndoUnit = (function () {
        function SelectionUndoUnit() {
            this._states = [];
        }
        SelectionUndoUnit.prototype.undo = function () {
            for (var i = 0; i < this._states.length; i++) {
                this._states[i].value.selected = this._states[i].undo;
            }
        };
        SelectionUndoUnit.prototype.redo = function () {
            for (var i = 0; i < this._states.length; i++) {
                this._states[i].value.selected = this._states[i].redo;
            }
        };
        Object.defineProperty(SelectionUndoUnit.prototype, "isEmpty", {
            get: function () {
                for (var i = 0; i < this._states.length; i++) {
                    if (this._states[i].undo != this._states[i].redo) {
                        return false;
                    }
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        SelectionUndoUnit.prototype.select = function (value) {
            this.update(value, value.selected, true);
        };
        SelectionUndoUnit.prototype.deselect = function (value) {
            this.update(value, value.selected, false);
        };
        SelectionUndoUnit.prototype.update = function (value, undo, redo) {
            for (var i = 0; i < this._states.length; i++) {
                if (this._states[i].value == value) {
                    this._states[i].redo = redo;
                    return;
                }
            }
            this._states.push({ value: value, undo: undo, redo: redo });
        };
        return SelectionUndoUnit;
    })();
    Netron.SelectionUndoUnit = SelectionUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var Tracker = (function () {
        function Tracker(rectangle, resizable) {
            this._track = false;
            this._rectangle = rectangle.clone();
            this._resizable = resizable;
        }
        Object.defineProperty(Tracker.prototype, "rectangle", {
            get: function () {
                return this._rectangle;
            },
            enumerable: true,
            configurable: true
        });
        Tracker.prototype.hitTest = function (point) {
            // (0, 0) element, (-1, -1) top-left, (+1, +1) bottom-right
            if (this._resizable) {
                for (var x = -1; x <= +1; x++) {
                    for (var y = -1; y <= +1; y++) {
                        if ((x !== 0) || (y !== 0)) {
                            var hit = new Netron.Point(x, y);
                            if (this.getGripRectangle(hit).contains(point)) {
                                return hit;
                            }
                        }
                    }
                }
            }
            if (this._rectangle.contains(point)) {
                return new Netron.Point(0, 0);
            }
            return new Netron.Point(-2, -2);
        };
        Tracker.prototype.getGripRectangle = function (point) {
            var r = new Netron.Rectangle(0, 0, 7, 7);
            if (point.x < 0) {
                r.x = this._rectangle.x - 7;
            }
            if (point.x === 0) {
                r.x = this._rectangle.x + Math.floor(this._rectangle.width / 2) - 3;
            }
            if (point.x > 0) {
                r.x = this._rectangle.x + this._rectangle.width + 1;
            }
            if (point.y < 0) {
                r.y = this._rectangle.y - 7;
            }
            if (point.y === 0) {
                r.y = this._rectangle.y + Math.floor(this._rectangle.height / 2) - 3;
            }
            if (point.y > 0) {
                r.y = this._rectangle.y + this._rectangle.height + 1;
            }
            return r;
        };
        Tracker.prototype.getCursor = function (point) {
            var hit = this.hitTest(point);
            if ((hit.x === 0) && (hit.y === 0)) {
                return (this._track) ? Netron.Cursors.move : Netron.Cursors.select;
            }
            if ((hit.x >= -1) && (hit.x <= +1) && (hit.y >= -1) && (hit.y <= +1) && this._resizable) {
                if (hit.x === -1 && hit.y === -1) {
                    return "nw-resize";
                }
                if (hit.x === +1 && hit.y === +1) {
                    return "se-resize";
                }
                if (hit.x === -1 && hit.y === +1) {
                    return "sw-resize";
                }
                if (hit.x === +1 && hit.y === -1) {
                    return "ne-resize";
                }
                if (hit.x === 0 && hit.y === -1) {
                    return "n-resize";
                }
                if (hit.x === 0 && hit.y === +1) {
                    return "s-resize";
                }
                if (hit.x === +1 && hit.y === 0) {
                    return "e-resize";
                }
                if (hit.x === -1 && hit.y === 0) {
                    return "w-resize";
                }
            }
            return null;
        };
        Tracker.prototype.start = function (point, handle) {
            if ((handle.x >= -1) && (handle.x <= +1) && (handle.y >= -1) && (handle.y <= +1)) {
                this._handle = handle;
                this._currentPoint = point;
                this._track = true;
            }
        };
        Tracker.prototype.stop = function () {
            this._track = false;
        };
        Object.defineProperty(Tracker.prototype, "track", {
            get: function () {
                return this._track;
            },
            enumerable: true,
            configurable: true
        });
        Tracker.prototype.move = function (point) {
            var h = this._handle;
            var a = new Netron.Point(0, 0);
            var b = new Netron.Point(0, 0);
            if ((h.x == -1) || ((h.x === 0) && (h.y === 0))) {
                a.x = point.x - this._currentPoint.x;
            }
            if ((h.y == -1) || ((h.x === 0) && (h.y === 0))) {
                a.y = point.y - this._currentPoint.y;
            }
            if ((h.x == +1) || ((h.x === 0) && (h.y === 0))) {
                b.x = point.x - this._currentPoint.x;
            }
            if ((h.y == +1) || ((h.x === 0) && (h.y === 0))) {
                b.y = point.y - this._currentPoint.y;
            }
            var tl = new Netron.Point(this._rectangle.x, this._rectangle.y);
            var br = new Netron.Point(this._rectangle.x + this._rectangle.width, this._rectangle.y + this._rectangle.height);
            tl.x += a.x;
            tl.y += a.y;
            br.x += b.x;
            br.y += b.y;
            this._rectangle.x = tl.x;
            this._rectangle.y = tl.y;
            this._rectangle.width = br.x - tl.x;
            this._rectangle.height = br.y - tl.y;
            this._currentPoint = point;
        };
        Tracker.prototype.updateRectangle = function (rectangle) {
            this._rectangle = rectangle.clone();
        };
        Tracker.prototype.paint = function (context) {
            if (this._resizable) {
                for (var x = -1; x <= +1; x++) {
                    for (var y = -1; y <= +1; y++) {
                        if ((x !== 0) || (y !== 0)) {
                            var rectangle = this.getGripRectangle(new Netron.Point(x, y));
                            context.fillStyle = "#ffffff";
                            context.strokeStyle = "#000000";
                            context.lineWidth = 1;
                            context.fillRect(rectangle.x - 0.5, rectangle.y - 0.5, rectangle.width - 1, rectangle.height - 1);
                            context.strokeRect(rectangle.x - 0.5, rectangle.y - 0.5, rectangle.width - 1, rectangle.height - 1);
                        }
                    }
                }
            }
        };
        return Tracker;
    })();
    Netron.Tracker = Tracker;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var TransformUndoUnit = (function () {
        function TransformUndoUnit(element, undoRectangle, redoRectangle) {
            this._element = element;
            this._undoRectangle = undoRectangle.clone();
            this._redoRectangle = redoRectangle.clone();
        }
        TransformUndoUnit.prototype.undo = function () {
            this._element.rectangle = this._undoRectangle;
        };
        TransformUndoUnit.prototype.redo = function () {
            this._element.rectangle = this._redoRectangle;
        };
        Object.defineProperty(TransformUndoUnit.prototype, "isEmpty", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        return TransformUndoUnit;
    })();
    Netron.TransformUndoUnit = TransformUndoUnit;
})(Netron || (Netron = {}));
var Netron;
(function (Netron) {
    var UndoService = (function () {
        function UndoService() {
            this._container = null;
            this._stack = [];
            this._position = 0;
        }
        UndoService.prototype.begin = function () {
            this._container = new Netron.ContainerUndoUnit();
        };
        UndoService.prototype.cancel = function () {
            this._container = null;
        };
        UndoService.prototype.commit = function () {
            if (!this._container.isEmpty) {
                this._stack.splice(this._position, this._stack.length - this._position);
                this._stack.push(this._container);
                this.redo();
            }
            this._container = null;
        };
        UndoService.prototype.add = function (undoUnit) {
            this._container.add(undoUnit);
        };
        UndoService.prototype.undo = function () {
            if (this._position !== 0) {
                this._position--;
                this._stack[this._position].undo();
            }
        };
        UndoService.prototype.redo = function () {
            if ((this._stack.length !== 0) && (this._position < this._stack.length)) {
                this._stack[this._position].redo();
                this._position++;
            }
        };
        return UndoService;
    })();
    Netron.UndoService = UndoService;
})(Netron || (Netron = {}));
