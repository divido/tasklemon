const path = require('path');
const fs = require('fs');
const util = require('util');

module.exports = class Item {
	constructor(parentPath, name) {
		this._parentPath = parentPath;
		this._name = name;
	}
	
	get exists() { }
	
	get path() { }
	
	get name() {
		return this._name;
	}
	
	get size() { }
	
	get parent() {
		if (this.name === '') {
			// Root
			return null;
		} else {
			return Item.itemForPath(this._parentPath);
		}
	}
	
	get _stats() {
		return util.promisify(fs.lstat)(this.path);
	}
	
	static itemForPath(itemPath) {
		// Resolve path
		const parentPath = fs.realpathSync(path.dirname(itemPath));
		const name = path.basename(itemPath);
		const isFolder = (itemPath.slice(-1) === '/');
		
		const completePath = path.join(parentPath, name) + (isFolder ? '/' : '');
		
		// Find or create item
		let item = knownItems[completePath];
		
		if (!item) {
			const itemClass = isFolder ? require('./Folder') : require('./File');
			item = new itemClass(parentPath, name);
			knownItems[completePath] = item;
		}
		
		return item;
	}
}

let knownItems = {};
