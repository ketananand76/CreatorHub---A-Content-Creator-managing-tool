import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonModel {
  constructor(modelName) {
    this.modelName = modelName.toLowerCase();
    this.filePath = path.join(DATA_DIR, `${this.modelName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      console.error(`Error reading ${this.modelName} db:`, error);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error writing ${this.modelName} db:`, error);
    }
  }

  async find(query = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const key in query) {
        // Simple nesting check or strict check
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = this._read();
    return items.find(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }) || null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    this._write(items);
    return newDoc;
  }

  async findOneAndUpdate(query = {}, update, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;

    const current = items[index];
    let updated;
    if (update && update.$set) {
      updated = { ...current, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...current, ...(update || {}), updatedAt: new Date().toISOString() };
    }

    items[index] = updated;
    this._write(items);
    return updated;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    
    // Support update operations or direct updates
    const current = items[index];
    let updated;
    if (update.$set) {
      updated = { ...current, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    }
    
    items[index] = updated;
    this._write(items);
    return updated;
  }

  async updateOne(query, update) {
    const items = this._read();
    const index = items.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return { nModified: 0 };
    
    const current = items[index];
    let updated;
    if (update.$set) {
      updated = { ...current, ...update.$set, updatedAt: new Date().toISOString() };
    } else {
      updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    }
    
    items[index] = updated;
    this._write(items);
    return { nModified: 1 };
  }

  async deleteOne(query) {
    let items = this._read();
    const initialLen = items.length;
    items = items.filter(item => {
      for (const key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    this._write(items);
    return { deletedCount: initialLen - items.length };
  }

  async deleteMany(query = {}) {
    let items = this._read();
    const initialLen = items.length;
    items = items.filter(item => {
      for (const key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    this._write(items);
    return { deletedCount: initialLen - items.length };
  }
}

export const getJsonModel = (modelName) => {
  return new JsonModel(modelName);
};
