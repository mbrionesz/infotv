// Adapt the upstream public loading policy at bundle time; do not access private
// player instances from the app. Anchors fail closed if the dependency changes.
export function patchTsLoading(source){
 function replace(anchor,value){if(source.split(anchor).length!==2)throw new Error('Unexpected MPEG-TS loading policy: '+anchor.slice(0,70));source=source.replace(anchor,value);}
 const events='onMediaTimeUpdate: this._onMediaTimeUpdate.bind(this),\n        };';
 replace(events,events+"\n        this._media_element.addEventListener('pause', this.e.onMediaTimeUpdate);");
 replace('public destroy(): void {',"public destroy(): void {\n        this._media_element.removeEventListener('pause', this.e.onMediaTimeUpdate);");
 replace('if (buffered_end >= current_time + this._config.lazyLoadMaxDuration && !this._paused) {','const policy = this._config.xuperBufferPolicy && this._config.xuperBufferPolicy();\n        const limit = policy ? policy.maxAhead : this._config.lazyLoadMaxDuration;\n        if (buffered_end >= current_time + limit && !this._paused) {');
 replace('const recover_duration = this._config.lazyLoadRecoverDuration;', 'const policy = this._config.xuperBufferPolicy && this._config.xuperBufferPolicy();\n        const recover_duration = policy ? (policy.paused ? Math.max(0, policy.maxAhead - 1) : policy.resumeAhead) : this._config.lazyLoadRecoverDuration;');
 return source;
}
