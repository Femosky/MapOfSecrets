// HTMLMarker.ts
export function makeHTMLMarkerClass() {
    // at call time, `google.maps` is ready
    return class HTMLMarker extends google.maps.OverlayView {
        private el: HTMLDivElement;
        private pos: google.maps.LatLngLiteral;

        constructor(map: google.maps.Map, position: google.maps.LatLngLiteral, content: string, type: string) {
            super();
            this.pos = position;
            this.el = document.createElement('div');
            Object.assign(this.el.style, {
                position: 'absolute',
                transform: 'translate(-50%, -100%)',
                padding: '4px 8px',
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
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
            });
            this.el.innerText = content;
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

        onRemove() {
            this.el.remove();
        }
    };
}
