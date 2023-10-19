var con = require('./database');
var GLOBALS = require('./constants');
var notify = require('./notification');
var cryptoLib = require('cryptlib');
const localizify = require('localizify');
const en = require('../languages/en');
const {t} = require('localizify');


var Validate = {

    /**
     * Function to generate the random hash for token
     */
    generateSessionCode: function (user_id, callback) {

        var randtoken = require('rand-token').generator();
        var usersession = randtoken.generate(64, "0123456789abcdefghijklnmopqrstuvwxyz");

        Validate.checkDeviceInfo(user_id,  function (DeviceInfo, Error) {
            if (DeviceInfo != null) {
                var params = {
                    token: usersession
                };           
                Validate.updateDeviceInfo(user_id, params, function () {
                    callback(usersession);
                });
            } else {
                var params = {
                    token: usersession,
                    user_id: user_id,
                };
                
                Validate.addDeviceInformation(params, function () {
                    callback(usersession);
                });
            }
        });
    },

    /**
     * Function to check device information of any users
     */
    checkDeviceInfo: function (user_id,  callback) {

        con.query("SELECT * FROM tbl_user_deviceinfo WHERE user_id = '" + user_id + "'", function (err, result) {
            if (!err && result[0] != undefined) {
                callback(result[0]);
            } else {
                callback(null, err);
            }
        });
    },

    /**
     * Function to update device information of any users
     */
    updateDeviceInfo: function (user_id, params, callback) {
        con.query("UPDATE tbl_user_deviceinfo SET ? WHERE user_id = '" + user_id + "'", params, function (err, result, fields) {
            // console.log(err)
            callback(result);
        });
    },

    /**
     * Add Device Information for users
     */
    addDeviceInformation: function (params, callback) {

        con.query('INSERT INTO tbl_user_deviceinfo SET ?', params, function (err, result, fields) {
        //   console.log(err);
        //   console.log(result);
            callback(result.insertId);
        });
    },

    /**
     * Function to check and update device information
     */
    checkUpdateDeviceInfo: function (user_id, params, callback) {

        var upd_device = {
            uuid: (params.uuid != undefined) ? params.uuid : "",
            ip: (params.ip != undefined) ? params.ip : "",
            os_version: (params.os_version != undefined) ? params.os_version : "",
            model_name: (params.model_name != undefined) ? params.model_name : "",
            device_type: params.device_type,
            device_token: params.device_token,
        };

        Validate.checkDeviceInfo(user_id,  function (DeviceInfo, Error) {
           
            if (DeviceInfo != null) {
                Validate.updateDeviceInfo(user_id, upd_device, function (result, error) {
                    callback(result);
                });
            } else {
                upd_device.user_id = user_id;
        
                Validate.addDeviceInformation(upd_device, function (result, error) {
                    callback(result);
                });
            }
        });
    },

    

    sendSMS: function (phone, message, callback) {
        if (phone != '' && phone != undefined) {
            callback(true);
        } else {
            callback(false);
        }
    },

    genOrderId: function (order_id) { 
       let orderId;
       let num;
       if(order_id === '000'){
        num = Number(order_id + 1);
         orderId =  'PO-' + num;
       } else {
         num = order_id.split("-")[1];
        num = parseInt(num, 10); // Parse the string as an integer
        num++; // Increment the integer
        num = num.toString().padStart(order_id.split("-")[1].length, '0'); // Convert back to string with leading zeros
        const new_order_id = order_id.split("-")[0] + '-' + num;
        orderId = new_order_id;
       }
        

        return orderId;
    },

  
    random: function (callback) {
        var gen = require('random-number').generator({
            min: 0001,
            max: 9999,
            integer: true
        })
        callback(gen());
    },

  
    randomOtpGenerator: function () {
        // return Math.floor(0001 + Math.random() * 9000);
        return '1234';
    },

    getOrderCode: function () {
        return 'SERVICEBOOKING' + Math.floor(000000 + Math.random() * 999999);
    },

    generateToken : function () { 
        var randtoken = require('rand-token').generator();
        var usersession = randtoken.generate(64, "0123456789abcdefghijklnmopqrstuvwxyz");
        return usersession;
     },

 
    isEmptyObject: function(obj){
        return !Object.keys(obj).length;
    },

   
    send_email: function (subject, to_email, message, callback) {

        var transporter = require('nodemailer').createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        var mailOptions = {
            from: process.env.EMAIL_ID,
            to: to_email,
            subject: subject,
            html: message
        };
        transporter.sendMail(mailOptions, (error, info) => {
            console.log(error)
            if (error) {
                callback(false);
            } else {
                callback(true);
            }
        });
    },

    //Function to generate the random hash for forgot token
    generateVerifyCode: function (request, callback) {
        var randtoken = require('rand-token').generator();
        var verifytoken = randtoken.generate(64, "0123456789abcdefghijklnmopqrstuvwxyz");
        
        // console.log("---1---",request,"---------")
        Validate.checkUserInfo(request, function (userinfo) {
            if (userinfo != null) {
                var params = {
                    verify_token: verifytoken,
                };
                Validate.updateUserInfo(request, params, function () {
                    callback(params);
                });
            } else {
                var params = {
                    verify_token: verifytoken,
                    user_id: request.id,
                };
                // console.log(params)
                Validate.addUserInformation(params, function () {
                    callback(params);
                });
            }
        });
    },

    //Function to check User information of any users
    checkUserInfo: function (request, callback) {
        // console.log(request)
        var sql = "SELECT * FROM tbl_user WHERE id = '" + request.user_id + "' "
        con.query(sql, function (err, result) {
            // console.log(result)
            if (!err && result != undefined) {
                callback(result[0]);
            } else {
                callback(null, err);
            }
        });
    },

    updateUserInfo: function (request, params, callback) {
        con.query("UPDATE tbl_user SET ? WHERE id = '" + request.id + "'  ", params, function (err, result) {
            callback(result);
        });
    },

    insertNotification : function (request, callback) {
        con.query("INSERT INTO tbl_notification SET ?", request, function (err,result) {
            if(!err){
                callback(result)
            } else {
                callback(null)
            }
        })
    },


    commonPushNoti_BK: function (params, callback) { 
        var params1 = {
            receiver_id: params.receiver_id,
            sender_id : params.sender_id,
            message: params.message,
            tag: params.tag,
        }
        // console.log('object',params1)
        Validate.insertNotification(params1, function (result,fields) { 
            if(!result){
                // console.log('iside error =============')
                callback('0',{
                    keyword: 'rest_keyword_failed',
                    components: {}
                },null)
            } else {
                // console.log('ourside error - --------------')
                Validate.checkDeviceInfo(params.receiver_id, function (device_details) { 
                    // console.log('device_details',device_details)
                    var message_data = {
                        receiver_id : params.receiver_id,
                        sender_id : params.sender_id,
                        device_token: device_details.device_token,
                        device_type: device_details.device_type,
                        tag: params.tag,
                        id: result.insertId,
                        message: params.message
                    }

                    notify.sendPush(device_details.device_token, message_data, function (status) { 
                        // console.log('--------------------',status)
                        if(status){
                            con.query("SELECT * FROM tbl_notification WHERE id = '"+message_data.id+"'", function (err2, notifi_data) { 
                                var response = {
                                    sender_id : notifi_data[0].sender_id,
                                    receiver_id : notifi_data[0].receiver_id,
                                    message: notifi_data[0].message,
                                    tag: notifi_data[0].tag
                                }
                                callback(response)
                            })
                        } else {
                            callback(false);
                        }
                    })
                })
            }
        })
    },



}

module.exports = Validate;
