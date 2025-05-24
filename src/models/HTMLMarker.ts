// HTMLMarker.ts
export function makeHTMLMarkerClass() {
    // at call time, `google.maps` is ready
    return class HTMLMarker extends google.maps.OverlayView {
        private el: HTMLDivElement;
        private pos: google.maps.LatLngLiteral;
        id: string;
        type: string;
        clickHandler: (id: string, type: string) => void;

        constructor(
            map: google.maps.Map,
            position: google.maps.LatLngLiteral,
            content: string,
            type: string,
            id: string,
            clickHandler: (id: string, type: string) => void
        ) {
            super();
            this.id = id;
            this.type = type;
            this.pos = position;
            this.clickHandler = clickHandler;
            this.el = document.createElement('div');
            Object.assign(this.el.style, {
                position: 'absolute',
                transform: 'translate(-50%, -100%)',
                padding: '4px 8px',
                maxWidth: '10rem',
                overflow: 'hidden', // hide the rest
                display: '-webkit-box', // establish the box
                WebkitBoxOrient: 'vertical', // stack vertically
                WebkitLineClamp: '4',
                color: 'white',
                border: '1px solid white',
                borderRadius: '4px',
                cursor: 'pointer',
                zIndex: '0',
                background:
                    type === 'note'
                        ? 'black'
                        : type === 'cityTown'
                        ? 'green'
                        : type === 'stateProvince'
                        ? 'blue'
                        : type === 'country'
                        ? 'red'
                        : 'orange',
            });
            this.el.innerText = content;
            this.el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clickHandler(this.id, this.type);
            });
            this.setMap(map);
        }

        onAdd() {
            this.getPanes()!.overlayMouseTarget!.appendChild(this.el);
        }

        draw() {
            const proj = this.getProjection()!;
            const point = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.pos))!;
            this.el.style.left = point.x + 'px';
            this.el.style.top = point.y + 'px';
        }

        setZIndex(z: number) {
            this.el.style.zIndex = String(z);
        }

        onRemove() {
            this.el.remove();
        }
    };
}
