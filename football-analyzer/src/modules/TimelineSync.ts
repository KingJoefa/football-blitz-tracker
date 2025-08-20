import { PlaySequence, TimelineEvent, Position, Player } from '../types';

export interface VideoSyncOptions {
  videoElement?: HTMLVideoElement;
  playbackRate?: number;
  autoSync?: boolean;
  offsetMs?: number;
}

export class TimelineSync {
  private timeline: PlaySequence | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private playbackRate: number = 1;
  private autoSync: boolean = true;
  private offsetMs: number = 0;
  private animationFrameId: number | null = null;

  private onTimeUpdateCallback?: (time: number, positions: { [playerId: string]: Position }) => void;
  private onPlayStateChangeCallback?: (isPlaying: boolean) => void;
  private onSeekCallback?: (time: number) => void;

  constructor(options: VideoSyncOptions = {}) {
    this.videoElement = options.videoElement || null;
    this.playbackRate = options.playbackRate || 1;
    this.autoSync = options.autoSync ?? true;
    this.offsetMs = options.offsetMs || 0;

    this.setupVideoEvents();
  }

  public setTimeline(timeline: PlaySequence): void {
    this.timeline = timeline;
    this.duration = timeline.duration;
    this.currentTime = 0;
    
    if (this.videoElement && this.autoSync) {
      this.syncVideoToTimeline();
    }
  }

  public setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
    this.setupVideoEvents();
    
    if (this.autoSync && this.timeline) {
      this.syncVideoToTimeline();
    }
  }

  public setOnTimeUpdate(callback: (time: number, positions: { [playerId: string]: Position }) => void): void {
    this.onTimeUpdateCallback = callback;
  }

  public setOnPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this.onPlayStateChangeCallback = callback;
  }

  public setOnSeek(callback: (time: number) => void): void {
    this.onSeekCallback = callback;
  }

  private setupVideoEvents(): void {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('play', () => {
      this.play();
    });

    this.videoElement.addEventListener('pause', () => {
      this.pause();
    });

    this.videoElement.addEventListener('seeked', () => {
      if (this.autoSync) {
        this.syncTimelineToVideo();
      }
    });

    this.videoElement.addEventListener('timeupdate', () => {
      if (this.autoSync && !this.isPlaying) {
        this.syncTimelineToVideo();
      }
    });

    this.videoElement.addEventListener('ratechange', () => {
      this.playbackRate = this.videoElement!.playbackRate;
    });
  }

  public play(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.onPlayStateChangeCallback?.(true);

    if (this.videoElement && this.autoSync) {
      this.videoElement.play();
    }

    this.startAnimationLoop();
  }

  public pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.onPlayStateChangeCallback?.(false);

    if (this.videoElement && this.autoSync) {
      this.videoElement.pause();
    }

    this.stopAnimationLoop();
  }

  public seek(timeMs: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, timeMs));
    
    if (this.videoElement && this.autoSync) {
      this.videoElement.currentTime = (this.currentTime + this.offsetMs) / 1000;
    }

    this.updatePositions();
    this.onSeekCallback?.(this.currentTime);
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    
    if (this.videoElement) {
      this.videoElement.playbackRate = rate;
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public isTimelinePlaying(): boolean {
    return this.isPlaying;
  }

  public setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
  }

  public setOffset(offsetMs: number): void {
    this.offsetMs = offsetMs;
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId) return;

    const animate = () => {
      if (!this.isPlaying) return;

      this.currentTime += (16.67 * this.playbackRate); // ~60fps
      
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.pause();
        return;
      }

      this.updatePositions();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updatePositions(): void {
    if (!this.timeline) return;

    const positions = this.interpolatePositions(this.currentTime);
    this.onTimeUpdateCallback?.(this.currentTime, positions);
  }

  private interpolatePositions(time: number): { [playerId: string]: Position } {
    if (!this.timeline) return {};

    const events = this.timeline.timeline;
    const positions: { [playerId: string]: Position } = {};

    // Find the two events to interpolate between
    let beforeEvent: TimelineEvent | null = null;
    let afterEvent: TimelineEvent | null = null;

    for (let i = 0; i < events.length; i++) {
      if (events[i].timestamp <= time) {
        beforeEvent = events[i];
      } else {
        afterEvent = events[i];
        break;
      }
    }

    if (!beforeEvent) {
      // Before first event, use first event positions
      beforeEvent = events[0];
      Object.assign(positions, beforeEvent.playerPositions);
    } else if (!afterEvent) {
      // After last event, use last event positions
      Object.assign(positions, beforeEvent.playerPositions);
    } else {
      // Interpolate between events
      const t = (time - beforeEvent.timestamp) / (afterEvent.timestamp - beforeEvent.timestamp);
      
      // Get all unique player IDs
      const playerIds = new Set([
        ...Object.keys(beforeEvent.playerPositions),
        ...Object.keys(afterEvent.playerPositions)
      ]);

      playerIds.forEach(playerId => {
        const beforePos = beforeEvent!.playerPositions[playerId];
        const afterPos = afterEvent!.playerPositions[playerId];

        if (beforePos && afterPos) {
          // Linear interpolation
          positions[playerId] = {
            x: beforePos.x + (afterPos.x - beforePos.x) * t,
            y: beforePos.y + (afterPos.y - beforePos.y) * t
          };
        } else if (beforePos) {
          positions[playerId] = beforePos;
        } else if (afterPos) {
          positions[playerId] = afterPos;
        }
      });
    }

    return positions;
  }

  private syncVideoToTimeline(): void {
    if (!this.videoElement || !this.timeline) return;
    
    const videoTime = (this.currentTime + this.offsetMs) / 1000;
    this.videoElement.currentTime = videoTime;
  }

  private syncTimelineToVideo(): void {
    if (!this.videoElement || !this.timeline) return;
    
    const timelineTime = (this.videoElement.currentTime * 1000) - this.offsetMs;
    this.currentTime = Math.max(0, Math.min(this.duration, timelineTime));
    this.updatePositions();
  }

  public exportTimelineData(): any {
    if (!this.timeline) return null;

    return {
      timeline: this.timeline,
      currentTime: this.currentTime,
      playbackRate: this.playbackRate,
      offset: this.offsetMs
    };
  }

  public importTimelineData(data: any): void {
    if (data.timeline) {
      this.setTimeline(data.timeline);
    }
    
    if (typeof data.currentTime === 'number') {
      this.seek(data.currentTime);
    }
    
    if (typeof data.playbackRate === 'number') {
      this.setPlaybackRate(data.playbackRate);
    }
    
    if (typeof data.offset === 'number') {
      this.setOffset(data.offset);
    }
  }

  public addTimelineEvent(event: TimelineEvent): void {
    if (!this.timeline) return;

    // Insert event in chronological order
    const insertIndex = this.timeline.timeline.findIndex(e => e.timestamp > event.timestamp);
    
    if (insertIndex === -1) {
      this.timeline.timeline.push(event);
    } else {
      this.timeline.timeline.splice(insertIndex, 0, event);
    }

    // Update duration if necessary
    this.duration = Math.max(this.duration, event.timestamp + 1000);
  }

  public removeTimelineEvent(timestamp: number): void {
    if (!this.timeline) return;

    const index = this.timeline.timeline.findIndex(e => Math.abs(e.timestamp - timestamp) < 50);
    if (index !== -1) {
      this.timeline.timeline.splice(index, 1);
    }
  }

  public getTimelineEventAt(time: number): TimelineEvent | null {
    if (!this.timeline) return null;

    return this.timeline.timeline.find(e => Math.abs(e.timestamp - time) < 100) || null;
  }

  public getPhaseAtTime(time: number): 'pre-snap' | 'snap' | 'post-snap' | 'end' {
    if (!this.timeline) return 'pre-snap';

    const snapEvent = this.timeline.timeline.find(e => e.eventType === 'snap');
    if (!snapEvent) return 'pre-snap';

    if (time < snapEvent.timestamp) {
      return 'pre-snap';
    } else if (time < snapEvent.timestamp + 500) {
      return 'snap';
    } else if (time < this.duration - 500) {
      return 'post-snap';
    } else {
      return 'end';
    }
  }

  public seekToPhase(phase: 'pre-snap' | 'snap' | 'post-snap' | 'end'): void {
    if (!this.timeline) return;

    const snapEvent = this.timeline.timeline.find(e => e.eventType === 'snap');
    
    switch (phase) {
      case 'pre-snap':
        this.seek(0);
        break;
      case 'snap':
        if (snapEvent) {
          this.seek(snapEvent.timestamp);
        }
        break;
      case 'post-snap':
        if (snapEvent) {
          this.seek(snapEvent.timestamp + 500);
        } else {
          this.seek(this.duration * 0.5);
        }
        break;
      case 'end':
        this.seek(this.duration);
        break;
    }
  }

  public createSnapshot(): TimelineEvent {
    const positions: { [playerId: string]: Position } = {};
    
    // Get current positions from interpolation
    const currentPositions = this.interpolatePositions(this.currentTime);
    Object.assign(positions, currentPositions);

    return {
      timestamp: this.currentTime,
      playerPositions: positions,
      eventType: 'movement'
    };
  }

  public dispose(): void {
    this.pause();
    this.stopAnimationLoop();
    
    if (this.videoElement) {
      this.videoElement.removeEventListener('play', this.play);
      this.videoElement.removeEventListener('pause', this.pause);
    }
  }
}