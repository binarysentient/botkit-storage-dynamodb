/**
 * botkit-storage-mongo - MongoDB driver for Botkit
 *
 * @param  {Object} config Must contain a dynamoRegion, dynamoAccessKey,
 *         dynamoAccessSecret properties, optionally dynamoTable (defaults to botkit)
 * @return {Object} A storage object conforming to the Botkit storage interface
 */
module.exports = function(config) {
    /**
     */
    if (!config || !config.dynamoRegion || !config.dynamoAccessKey || !config.dynamoAccessSecret) {
        throw new Error('Need to provide dynamo dynamoRegion, dynamoAccessKey,' +
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
            dynamo.find({hash: id, range: type}, cb);
        },
        save: function(data, cb) {
            data[type] = type;
            dynamo.insert(data, cb);
        },
        all: function(cb) {
            // Do something?
        }
    };
}