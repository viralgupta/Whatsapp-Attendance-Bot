const SendMessage = require('../utils/sendMessage');
const connection = require('../utils/redisConnection.js')

/**
 * @typedef {Object} MessageType
 * @property {string} app - The name of the application.
 * @property {number} timestamp - The timestamp of the message.
 * @property {number} version - The version of the message.
 * @property {string} type - The type of the message. Should be one of "text", "image", "file", "audio", "video", "contact", "location", "button_reply", or "list_reply".
 * @property {Object} payload - The payload of the message.
 * @property {string} payload.id - The ID of the message payload.
 * @property {string} payload.source - The source of the message.
 * @property {string} payload.type - The type of the payload.
 * @property {Object} payload.payload - The payload data.
 * @property {string} payload.payload.text - The text of the message if the type is "text".
 * @property {Object} payload.sender - Information about the sender.
 * @property {string} payload.sender.phone - The phone number of the sender.
 * @property {string} payload.sender.name - The name of the sender.
 * @property {string} payload.sender.country_code - The country code of the sender.
 * @property {string} payload.sender.dial_code - The dial code of the sender.
 */
const axios = require('axios').default;
require('dotenv').config()

/**
 * @param {MessageType} message - The message to check.
 * @returns {Promise<boolean>}
 */
const checkSpam = async ( message) => {
    const client = connection.Client;
    const value = Number(await client.get(message.payload.source))
    if(value !== null){
        if(value <= 15){
            await client.set(message.payload.source, value + 1, {XX: true})
            return false, value+1;
        }
        else if(value > 15 && value < 25){
            await client.set(message.payload.source, value + 2, {XX: true})
            await SendMessage({to: message.payload.source, message: "There is a rate limit, Please do not send any more messages in this day or you will get banned!"})
            return false, value+2;
        }
        else{
            await client.disconnect()
            const data = new URLSearchParams();
            data.append('phone', message.payload.source);
            data.append('block', 'true');
            try {
                await axios.put("https://api.gupshup.io/sm/api/v1/app/block/SrmAttendanceBot", data, {
                    headers: {
                        'apikey': process.env.GUPSHUP_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
            } catch (error) {
                try {
                    await axios.put("https://api.gupshup.io/sm/api/v1/app/block/SrmAttendanceBot", data, {
                        headers: {
                            'apikey': process.env.GUPSHUP_KEY,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                } catch (error) {
                    await SendMessage({to: process.env.MY_PHONE, message: `Block this number: ${message.payload.source} !!!`})
                }
            }
            return true, 31;
        }
    }
    else{
        await client.set(message.payload.source, 1, {NX: true, EXAT: message.timestamp + 86400})
        return false, 1;
    }
};

module.exports = checkSpam