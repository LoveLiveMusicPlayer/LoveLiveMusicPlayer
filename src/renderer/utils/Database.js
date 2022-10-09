const Datastore = require('nedb');

function DB(database) {
    let options = {
        filename: database,
        autoload: true,
    };
    this.db = new Datastore(options);
}

/**
 * 查找一条
 * @param query object 条件
 * @param select object 过滤结果
 * @param sort object 排序规则
 **/
DB.prototype.findOne = function (query, select, sort) {
    return new Promise((resolve, reject) => {
        let stmt = this.db.findOne(query || {});
        if (sort !== undefined) {
            stmt.sort(sort || {_id: 1});
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
 * 从${index}开始查询${limit}条数据
 * @param index
 * @param limit
 */
DB.prototype.find = function (index, limit) {
    return new Promise((resolve, reject) => {
        this.db.find().skip(index).limit(limit).sort({_id: 1}).exec((err, doc) => {
            if (err) {
                return reject(err)
            }
            resolve(doc)
        })
    })
}

/**
 * 查找多条
 * @param query object 条件
 * @param select object 过滤结果
 * @param sort object 排序规则
 * @param limit number 查询条数
 **/
DB.prototype.findAll = function (query, select, sort, limit) {
    return new Promise((resolve, reject) => {
        let stmt = this.db.find(query || {});
        if (sort !== undefined) {
            stmt.sort(sort || {_id: 1});
        }
        if (select !== undefined) {
            stmt.projection(select || {});
        }
        if (limit !== undefined) {
            stmt.limit(limit || 9999)
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
