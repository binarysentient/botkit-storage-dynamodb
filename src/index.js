/**
 * botkit-storage-dynamodb - DynamoDB driver for Botkit
 *
 * @param  {Object} config Must contain a dynamoRegion, dynamoAccessKey,
 *         dynamoAccessSecret properties, optionally dynamoTable (defaults to botkit)
 * @return {Object} A storage object conforming to the Botkit storage interface
 */
module.exports = function(config) {
    /**
     */
    if (!config || !config.dynamoRegion || !config.dynamoAccessKey || !config.dynamoAccessSecret) {
        throw new Error('Need to provide dynamoRegion, dynamoAccessKey,' +
                        ' dynamoAccessSecret');
    }
    config.dynamoTable = config.dynamoTable || 'botkit';

    var db = require('dynasty')({
        accessKeyId: config.dynamoAccessKey,
        secretAccessKey: config.dynamoAccessSecret,
        region: config.dynamoRegion
    });

    var storage = {};

    ['teams', 'channels', 'users'].forEach(function(type) {
        storage[type] = getStorage(db, config.dynamoTable, type);
    });

    return storage;
};

/**
 * Creates a storage object
 *
 * @param {Object} db A reference to our DynamoDB
 * @param {String} table The table to query
 * @param {String} type The type (teams, channels, users) to query in the table
 * @returns {{get: get, save: save, all: all}}
 */
function getStorage(db, table, type) {
    var dynamo = db.table(table);

    return {
        get: function(id, cb) {
            dynamo.find({hash: type, range: id})
            .then(function(res) {
                res = res || {};
                if (Object.keys(res).length === 0) { // no result found
                    cb('No result found for ' + id, null);
                } else { // result found
                    cb(null, res);
                }
            }).catch(function(err) {
                cb(err, null);
            });
        },

        save: function(data, cb) {
            dynamo.update({ hash: type, range: data.id }, removeTypeAndID(data))
            .then(function(res) {
                res = res || {};
                cb(null, res);
            }).catch(function(err) {
                cb(err, null);
            });
        },

        all: function(cb) {
            dynamo.findAll(type)
            .then(function(res) {
                res = res || {};
                cb(null, res);
            }).catch(function(err) {
                cb(err, null);
            });
        }
    };
}

function removeTypeAndID(data) {
    var copy = JSON.parse(JSON.stringify(data));
    delete copy.id;
    delete copy.type;
    return copy;
}
