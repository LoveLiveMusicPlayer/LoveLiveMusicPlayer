const Datastore = require('nedb');

function DB(database) {
    let options = {
        filename: database,
        autoload: true,
    };
    this.db = new Datastore(options);
    // this.db.ensureIndex({ fieldName: 'id', unique: true });
}


DB.prototype.limit = function (offset, limit) {
    this.offset = offset || 0;
    this.limit = limit || 15;
    return this;
}


DB.prototype.sort = function (orderby) {
    this.orderby = orderby;
    return this;
}

/**
 * 查找一条
 * @param query object 查询条件
 **/
DB.prototype.findOne = function (query, select) {
    return new Promise((resolve, reject) => {
        let stmt = this.db.findOne(query || {});
        if (this.sort !== undefined) {
            stmt.sort(this.sort);
        }
        if (select !== undefined) {
            stmt.projection(select || {});
        }
        stmt.exec((err, doc) => {
            if (err) {
                return reject(err);
            }
            resolve(doc);
        })
    })
}

/**
 * 查找多条
 * @param query object 查询条件
 **/
DB.prototype.findAll = function (query, select) {
    return new Promise((resolve, reject) => {
        let stmt = this.db.find(query || {});
        if (this.sort !== undefined) {
            stmt.sort(this.sort);
        }
        if (select !== undefined) {
            stmt.projection(select || {});
        }
        stmt.exec((err, doc) => {
            if (err) {
                return reject(err);
            }
            resolve(doc);
        })
    })
}


/**
 * 插入数据
 * @param values 插入的数据
 * 使用array，实现批量插入。一旦其中一个操作失败，所有改变将会回滚。
 **/
DB.prototype.insert = function (values) {
    return new Promise((resolve, reject) => {
        this.db.insert(values, (err, newDoc) => {
            if (err) {
                return reject(err);
            }
            resolve(newDoc);
        })
    })
}

/**
 * 更新数据
 * @param query object 查询的数据
 * @param values: 更新的数据
 * @param options : object muti(默认false)，是否允许修改多条文档；upsert(默认为false)
 **/
DB.prototype.update = function (query, values, options) {
    return new Promise((resolve, reject) => {
        this.db.update(query || {}, values || {}, options || {}, (err, numAffected) => {
            if (err) {
                return reject(err);
            }
            resolve(numAffected);
        })
    });
}

/**
 * 查询并(有->更新;无->新增)
 * @param query object 查询的数据
 * @param value 更新的数据
 * @returns {Promise<unknown>}
 */
DB.prototype.insertOrUpdate = function (query, value) {
    let that = this
    return new Promise((resolve, reject) => {
        that.db.findOne(query, function (err, doc) {
            if (err) {
                return reject(err);
            }
            if (doc) {
                that.db.update(query, value, (err, newDoc) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(newDoc);
                })
            } else {
                that.db.insert(value, (err, newDoc) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(newDoc);
                })
            }
        })
    });
}

/**
 * 根据options配置删除所有query匹配到的文档集。
 * @param query: 与find和findOne中query参数的用法一致
 * @param options: 只有一个可用。multi(默认false)，允许删除多个文档
 **/
DB.prototype.remove = function (query, options) {
    return new Promise((resolve, reject) => {
        this.db.remove(query || {}, options || {}, (err, numAffected) => {
            if (err) {
                return reject(err);
            }
            resolve(numAffected);
        })
    });
}

module.exports = (database) => {
    return new DB(database);
}
