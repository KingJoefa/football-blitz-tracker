import { Player, FootballPosition } from '../types';

export class PlayerIcons {
  private svgNamespace = 'http://www.w3.org/2000/svg';

  public createPlayerIcon(player: Player, size: number = 24): SVGElement {
    const svg = document.createElementNS(this.svgNamespace, 'svg');
    svg.setAttribute('width', size.toString());
    svg.setAttribute('height', size.toString());
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.classList.add('player-icon', `player-${player.team}`);
    svg.setAttribute('data-player-id', player.id);

    // Player circle
    const circle = document.createElementNS(this.svgNamespace, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', player.team === 'offense' ? '#3B82F6' : '#EF4444');
    circle.setAttribute('stroke', '#FFFFFF');
    circle.setAttribute('stroke-width', player.isActive ? '3' : '2');

    // Active player glow effect
    if (player.isActive) {
      const defs = document.createElementNS(this.svgNamespace, 'defs');
      const filter = document.createElementNS(this.svgNamespace, 'filter');
      filter.setAttribute('id', `glow-${player.id}`);
      
      const feGaussianBlur = document.createElementNS(this.svgNamespace, 'feGaussianBlur');
      feGaussianBlur.setAttribute('stdDeviation', '3');
      feGaussianBlur.setAttribute('result', 'coloredBlur');
      
      const feMerge = document.createElementNS(this.svgNamespace, 'feMerge');
      const feMergeNode1 = document.createElementNS(this.svgNamespace, 'feMergeNode');
      feMergeNode1.setAttribute('in', 'coloredBlur');
      const feMergeNode2 = document.createElementNS(this.svgNamespace, 'feMergeNode');
      feMergeNode2.setAttribute('in', 'SourceGraphic');
      
      feMerge.appendChild(feMergeNode1);
      feMerge.appendChild(feMergeNode2);
      filter.appendChild(feGaussianBlur);
      filter.appendChild(feMerge);
      defs.appendChild(filter);
      svg.appendChild(defs);
      
      circle.setAttribute('filter', `url(#glow-${player.id})`);
    }

    // Player number text
    const text = document.createElementNS(this.svgNamespace, 'text');
    text.setAttribute('x', '12');
    text.setAttribute('y', '16');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#FFFFFF');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.textContent = player.number.toString();

    // Position indicator
    const positionIcon = this.createPositionIcon(player.position);
    if (positionIcon) {
      svg.appendChild(positionIcon);
    }

    svg.appendChild(circle);
    svg.appendChild(text);

    // Add interaction classes
    svg.classList.add('cursor-pointer', 'hover:scale-110', 'transition-transform');

    return svg;
  }

  private createPositionIcon(position: FootballPosition): SVGElement | null {
    const iconGroup = document.createElementNS(this.svgNamespace, 'g');
    iconGroup.setAttribute('transform', 'translate(16, 2)');

    // Position-specific icons (small indicators)
    const iconPath = document.createElementNS(this.svgNamespace, 'path');
    iconPath.setAttribute('fill', '#FFFFFF');
    iconPath.setAttribute('stroke', '#000000');
    iconPath.setAttribute('stroke-width', '0.5');

    switch (position) {
      case 'QB':
        // Star icon for quarterback
        iconPath.setAttribute('d', 'M3,0 L3.9,2.1 L6,2.1 L4.5,3.4 L5.1,5.4 L3,4.2 L0.9,5.4 L1.5,3.4 L0,2.1 L2.1,2.1 Z');
        break;
      case 'RB':
      case 'FB':
        // Diamond for running backs
        iconPath.setAttribute('d', 'M3,0 L6,3 L3,6 L0,3 Z');
        break;
      case 'WR':
      case 'TE':
        // Arrow for receivers
        iconPath.setAttribute('d', 'M0,3 L4,0 L4,2 L6,2 L6,4 L4,4 L4,6 Z');
        break;
      case 'LT':
      case 'LG':
      case 'C':
      case 'RG':
      case 'RT':
        // Square for linemen
        iconPath.setAttribute('d', 'M0,0 L6,0 L6,6 L0,6 Z');
        break;
      case 'DE':
      case 'DT':
      case 'NT':
        // Triangle for defensive line
        iconPath.setAttribute('d', 'M3,0 L6,6 L0,6 Z');
        break;
      case 'LB':
      case 'MLB':
      case 'OLB':
        // Pentagon for linebackers
        iconPath.setAttribute('d', 'M3,0 L6,2 L5,6 L1,6 L0,2 Z');
        break;
      case 'CB':
      case 'S':
      case 'FS':
      case 'SS':
        // Circle for defensive backs
        iconPath.setAttribute('d', 'M3,0 A3,3 0 1,1 3,6 A3,3 0 1,1 3,0');
        break;
      default:
        return null;
    }

    iconGroup.appendChild(iconPath);
    return iconGroup;
  }

  public createRouteMarker(x: number, y: number, type: 'start' | 'waypoint' | 'end'): SVGElement {
    const svg = document.createElementNS(this.svgNamespace, 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.classList.add('route-marker', `route-marker-${type}`);
    svg.style.position = 'absolute';
    svg.style.left = `${x - 6}px`;
    svg.style.top = `${y - 6}px`;

    const marker = document.createElementNS(this.svgNamespace, 'circle');
    marker.setAttribute('cx', '6');
    marker.setAttribute('cy', '6');
    marker.setAttribute('r', type === 'waypoint' ? '3' : '4');

    switch (type) {
      case 'start':
        marker.setAttribute('fill', '#22C55E');
        marker.setAttribute('stroke', '#16A34A');
        break;
      case 'waypoint':
        marker.setAttribute('fill', '#F59E0B');
        marker.setAttribute('stroke', '#D97706');
        break;
      case 'end':
        marker.setAttribute('fill', '#EF4444');
        marker.setAttribute('stroke', '#DC2626');
        break;
    }

    marker.setAttribute('stroke-width', '1');
    marker.classList.add('cursor-pointer');

    svg.appendChild(marker);
    return svg;
  }

  public createFormationLine(x1: number, y1: number, x2: number, y2: number): SVGElement {
    const svg = document.createElementNS(this.svgNamespace, 'svg');
    const line = document.createElementNS(this.svgNamespace, 'line');
    
    line.setAttribute('x1', x1.toString());
    line.setAttribute('y1', y1.toString());
    line.setAttribute('x2', x2.toString());
    line.setAttribute('y2', y2.toString());
    line.setAttribute('stroke', '#6B7280');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3,3');
    line.setAttribute('opacity', '0.6');

    svg.appendChild(line);
    return svg;
  }

  public createPressureIndicator(x: number, y: number, intensity: number): SVGElement {
    const svg = document.createElementNS(this.svgNamespace, 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.classList.add('pressure-indicator');
    svg.style.position = 'absolute';
    svg.style.left = `${x - 10}px`;
    svg.style.top = `${y - 10}px`;

    // Animated pressure rings
    for (let i = 0; i < 3; i++) {
      const circle = document.createElementNS(this.svgNamespace, 'circle');
      circle.setAttribute('cx', '10');
      circle.setAttribute('cy', '10');
      circle.setAttribute('r', (3 + i * 2).toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#EF4444');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('opacity', (1 - i * 0.3).toString());

      // Animate the rings
      const animate = document.createElementNS(this.svgNamespace, 'animate');
      animate.setAttribute('attributeName', 'r');
      animate.setAttribute('values', `${3 + i * 2};${8 + i * 2};${3 + i * 2}`);
      animate.setAttribute('dur', '2s');
      animate.setAttribute('repeatCount', 'indefinite');
      animate.setAttribute('begin', `${i * 0.3}s`);

      circle.appendChild(animate);
      svg.appendChild(circle);
    }

    return svg;
  }

  public updatePlayerPosition(playerId: string, x: number, y: number): void {
    const playerIcon = document.querySelector(`[data-player-id="${playerId}"]`) as SVGElement;
    if (playerIcon) {
      playerIcon.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  public setPlayerSelected(playerId: string, selected: boolean): void {
    const playerIcon = document.querySelector(`[data-player-id="${playerId}"]`) as SVGElement;
    if (playerIcon) {
      const circle = playerIcon.querySelector('circle');
      if (circle) {
        if (selected) {
          circle.setAttribute('stroke', '#FBBF24');
          circle.setAttribute('stroke-width', '4');
          playerIcon.classList.add('selected');
        } else {
          circle.setAttribute('stroke', '#FFFFFF');
          circle.setAttribute('stroke-width', '2');
          playerIcon.classList.remove('selected');
        }
      }
    }
  }

  public setPlayerActive(playerId: string, active: boolean): void {
    const playerIcon = document.querySelector(`[data-player-id="${playerId}"]`) as SVGElement;
    if (playerIcon) {
      const circle = playerIcon.querySelector('circle');
      if (circle) {
        circle.setAttribute('stroke-width', active ? '3' : '2');
        if (active) {
          playerIcon.classList.add('active');
        } else {
          playerIcon.classList.remove('active');
        }
      }
    }
  }
}