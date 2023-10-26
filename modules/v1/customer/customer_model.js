var con = require('../../../config/database');
var GLOBALS = require('../../../config/constants');
var common = require('../../../config/common');
var cryptoLib = require('cryptlib');
const { use } = require('./route');
var shaKey = cryptoLib.getHashSha256(GLOBALS.KEY, 32);
var asyncLoop = require('node-async-loop');
var moment = require('moment');
const remindNoti = require('../../../config/notification')
var emailTemplate = require('../../../config/template');
const aws = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

const s3 = new aws.S3({
    accessKeyId: 'AKIAVPLV3K6GCR74BC6S',
    secretAccessKey: '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',
    region: 'ap-southeast-2',
    signatureVersion: 'v4'
});


var Auth = {

    userdetails: function(user_id, callback) {
        con.query("SELECT u.*,concat('" + GLOBALS.S3_BUCKET_ROOT + GLOBALS.USER_IMAGE + "','',u.profile_image) as profile_image,IFNULL(ut.device_token,'') as device_token,IFNULL(ut.device_type,'') as device_type,IFNULL(ut.token,'') as token FROM tbl_user u LEFT JOIN tbl_user_deviceinfo as ut ON u.id = ut.user_id WHERE u.id = '" + user_id + "' AND u.is_deleted='0' GROUP BY u.id", function(err, result, fields) {
            if (!err && result.length > 0) {
                callback(result[0]);
            } else {
                console.log(err);
                callback(null);
            }
        });
    },

    checkUniqueFields: function(user_id, request, callback) {

        Auth.checkUniqueEmail(user_id, request, function(emailcode, emailmsg, emailUnique) {
            if (emailUnique) {
                // Auth.checkUniquePhone(user_id, request, function(phonecode, phonemsg, phoneUnique) {
                //     if (phoneUnique) {
                        callback(emailcode, emailmsg, emailUnique);
                    // } else {
                    //     callback(phonecode, phonemsg, phoneUnique);
                    // }
                // });
            } else {
                callback(emailcode, emailmsg, emailUnique);
            }
        });
    },

    checkUniqueEmail: function(user_id, request, callback) {

        if (request.email != undefined && request.email != '') {

            if (user_id != undefined && user_id != '') {
                var uniqueEmail = "SELECT * FROM tbl_user WHERE email = '" + request.email + "' AND is_deleted='0' AND id != '" + user_id + "' ";
            } else {
                var uniqueEmail = "SELECT * FROM tbl_user WHERE email = '" + request.email + "' AND is_deleted='0'  ";
            }
            con.query(uniqueEmail, function(error, result, fields) {
                if (!error && result[0] != undefined) {
                    if (result[0].is_verify == 0) {
                        con.query(`DELETE FROM tbl_user WHERE id= ${result[0].id}`, function(error1, result1, fields1) {
                            con.query(`DELETE FROM tbl_user_deviceinfo WHERE user_id= ${result[0].id}`, function(error1, result1, fields1) {
                                callback('1', "Success", true);
                            })
                        })
                    } else {
                        callback('0', {
                            keyword: 'rest_keywords_duplicate_email',
                            components: {}
                        }, false);
                    }
                } else {
                    callback('1', 'success', true);
                }
            });

        } else {
            callback('1', "Success", true);
        }
    },

    // checkUniquePhone: function(user_id, request, callback) {
    //     if (request.phone != undefined && request.phone != '') {
    //         if (user_id != undefined && user_id != '') {
    //             var uniquePhone = "SELECT * FROM tbl_user WHERE phone = '" + request.phone + "' AND country_code='" + request.country_code + "' AND is_deleted='0' AND id != '" + user_id + "'";
    //         } else {
    //             var uniquePhone = "SELECT * FROM tbl_user WHERE phone = '" + request.phone + "' AND country_code='" + request.country_code + "' AND is_deleted='0' ";
    //         }

    //         con.query(uniquePhone, function(error, result, fields) {
    //             console.log("unqiue phone", result)
    //             if (!error && result[0] != undefined) {
    //                 if (result[0].is_otp_verify == 0) {
    //                     con.query(`DELETE FROM tbl_user WHERE id = ${result[0].id}`, function(error1, result1, fields1) {
    //                         con.query(`DELETE FROM tbl_user_deviceinfo WHERE user_id = ${result[0].id}`, function(error1, result1, fields1) {
    //                             callback('1', "Success", true);
    //                         })
    //                     })
    //                 } else {
    //                     callback('0', {
    //                         keyword: 'rest_keywords_duplicate_phone',
    //                         components: {}
    //                     }, false);
    //                 }
    //             } else {
    //                 callback('1', "Success", true);
    //             }
    //         });
    //     } else {
    //         callback('1', "Success", true);
    //     }
    // },

    signupCustomer: function (request, callback) {
        Auth.checkUniqueFields('', request, function (uniquecode, uniquemsg, isUnique) {
            if (isUnique) {
                var customer = {
                    fname: request.fname,
                    lname: request.lname,
                    email: request.email,
                    dob: request.dob,
                    password: cryptoLib.encrypt(JSON.stringify(request.password), shaKey, GLOBALS.IV),
                    verify_token: common.generateToken()
                };

                con.query(`INSERT INTO tbl_user SET ?`, customer, function (err, result, fields) {
                    if (!err) {
                        request.user_id = result.insertId;
                        common.checkUpdateDeviceInfo(result.insertId, request, function () {
                            Auth.userdetails(result.insertId, function (userprofile, err) {
                                common.generateSessionCode(result.insertId, function (Token) {
                                    userprofile.url = `http://localhost/test.php?token=` + userprofile.verify_token
                                    emailTemplate.verifyEmail(userprofile, function (verifytemplate) {
                                        common.send_email("GRID MASTER, VERIFY YOUR ACCOUNT", userprofile.email, verifytemplate, function (isSend) {

                                            delete userprofile.Token
                                            delete userprofile.password
                                            callback('1', {
                                                keyword: 'rest_keywords_user_phone_signup_success_otp_sent',
                                                components: {}
                                            }, userprofile);
                                        })
                                    })
                                });
                            });
                        });
                    } else {
                        callback('0', {
                            keyword: 'rest_keywords_user_signup_failed',
                            components: {}
                        }, null);
                    }
                });
            } else {
                callback(uniquecode, uniquemsg, null);
            }
        });
    },

    checkLogin: function (request, callback) {
        con.query(`SELECT * FROM tbl_user WHERE email = '${request.email}' AND is_active = 1 AND is_deleted = 0`, function (err, result) {
            if (!err) {
                if (result.length > 0) {
                    if (result[0].is_verify != 0) {

                        if (result[0].password == request.password) {
                            common.checkUpdateDeviceInfo(result[0].id, request, function () {
                                Auth.userdetails(result[0].id, function (userprofile) {
                                    common.generateSessionCode(result[0].id, function (Token) {
                                        delete userprofile.password
					userprofile.token = Token
                                        callback('1', {
                                            keyword: 'Signin Success',
                                            components: {}
                                        }, userprofile);
                                    });
                                });
                            });
                        } else {
                            callback('0', {
                                keyword: 'rest_wrong_login_password',
                                components: {}
                            }, null)
                        }
                    } else {
                        callback('0', {
                            keyword: 'rest_keyword_verify_accoun',
                            components: {}
                        }, null)
                    }
                } else {
                    callback('0', {
                        keyword: 'rest_wrong_login_emailphone',
                        components: {}
                    }, null)
                }
            } else {
                callback('0', {
                    keyword: 'rest_keyword_failed',
                    components: {}
                }, null)
            }
        })
    },

    editProfile: function(request, callback) {
        Auth.userdetails(request.user_id, function(userData) {
            if (userData) {
                var data = {
                    profile_image: (request.profile_image) ? request.profile_image : userData.profile_image,
                    fname: (request.fname) ? request.fname : userData.fname,
                    lname: (request.lname) ? request.lname : userData.lname,
                    email: (request.email) ? request.email : userData.email,
                    phone: (request.phone) ? request.phone : userData.phone,
                    address: (request.address) ? request.address : userData.address,
                }
                con.query(`UPDATE tbl_user SET ? WHERE id = ${request.user_id} AND is_active = 1 AND is_deleted = 0`, data, function(error, result) {
                    if (!error) {
                        Auth.userdetails(request.user_id, function(data) {
                            delete data.password;
                            callback('1', { keyword: 'rest_profile_upd_success', components: {} }, data);
                        })
                    } else {
                        callback('0', { keyword: 'rest_key_failed', components: {} }, null)
                    }
                })
            } else {
                callback('0', { keyword: 'rest_key_failed', components: {} }, null)
            }
        })
    },

    verifyAccount: function (request, callback) { 
        con.query(`SELECT * from tbl_user where verify_token='${request.verify_token}'`, function (err,result) { 
            if (!err && result[0] != undefined) {
                con.query(`UPDATE tbl_user SET is_verify=1, verify_token='' WHERE id='${result[0].id}'`, function (err1,result1) {
                    if (!err1 && result1.affectedRows > 0) {
                        callback('1',{ keyword:'rest_success', components:{} },result1)
                    } else {
                        callback('0',{ keyword:'rest_key_failed', components:{} },null)
                    }
                })
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    logOut: function(request, callback) {
        var log = {
            token: '',
            device_token: '',
            uuid: '',
        }
        con.query(`UPDATE tbl_user_deviceinfo SET ? WHERE user_id = '${request.user_id}'`, log, function(err, result) {
            if (!err && result.affectedRows > 0) {
                callback('1', { keyword: 'rest_keyword_signout_success', components: {} }, result)
            } else {
                callback('0', { keyword: 'rest_keyword_failed_signout', components: {} }, null)
            }
        })
    },

updateUserInfo: function(id,params, callback){
	con.query(`UPDATE tbl_user SET ? WHERE id= '${id}'`, params, function(err, result) {
            if (!err && result.affectedRows > 0) {
                callback(result)
            } else {
                callback(null)
            }
        })
},

    forgotPassword: function(request, callback) {
        con.query(`SELECT * FROM tbl_user WHERE  email='${request.email}' AND is_verify = '1' AND is_active = 1 AND is_deleted = 0`, function(error, result) {
            if (!error) {
                if (result.length > 0) {
                    var randtoken = require('rand-token').generator();
                    var radnpas = randtoken.generate(8, "0123456789abcdefghijklnmopqrstuvwxyz");

                    var verify = {
                       password : radnpas
                    }
                    Auth.updateUserInfo(result[0].id, verify, function(resion) {
                        Auth.userdetails(result[0].id, function(response) {
                            response.password = radnpas
                            emailTemplate.forgotPassword(response, function (verifytemplate) {
                                common.send_email("Ballina Farm Fresh: Forgot Your Password", response.email, verifytemplate, function (isSend) { 
                                    callback('1', {
                                        keyword: "Please Check your Email",
                                        components: {}
                                    }, [])
                                })
                            })
                        })
                    })
                } else {
                    callback('0', { keyword: 'Your Email is not registered. Please Signup with your details', components: {} }, null)
                }
            } else {
                callback('0', { keyword: 'rest_key_failed', components: {} }, null)
            }
        })
    },

    changePassword: function (request, callback) {  
        con.query(`select * from tbl_user where id='${request.user_id}' AND password = '${request.old_password}'`, function(err, result){
            if (!err && result[0] != undefined) {
                if(result[0].password === request.new_password){
                    callback('0',{ keyword:'Sorry, Your New Password cannot be the same as old Password', components:{} },[])
                    } else {
                        con.query(`update tbl_user SET password='${request.new_password}' WHERE id='${request.user_id}'`, ()=>{
                            callback('1',{ keyword:'Password Changed Successfully', components:{} },[])
                        })
                    }
            } else {
                callback('0',{ keyword:'Sorry! Old Password Does Not Match', components:{} },null)
            }
        })
    },

    deleteAccount: function (request, callback) { 
        con.query(`UPDATE tbl_user SET is_deleted = 1, is_active=0 WHERE id='${request.user_id}'`, function (err,result) { 
            if (!err && result.affectedRows > 0) {
                callback('1',{ keyword:'Your Account Has Been Deleted Success', components:{} },result)
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

 getUserProfile: function(request, callback) {
        con.query("SELECT u.*,concat('" + GLOBALS.S3_BUCKET_ROOT + GLOBALS.USER_IMAGE + "','',u.profile_image) as profile_image,IFNULL(ut.device_token,'') as device_token,IFNULL(ut.device_type,'') as device_type,IFNULL(ut.token,'') as token FROM tbl_user u LEFT JOIN tbl_user_deviceinfo as ut ON u.id = ut.user_id WHERE u.id = '" + request.user_id + "' AND u.is_deleted='0' GROUP BY u.id", function(err, result, fields) {
            if (!err && result.length > 0) {
                callback('1',{ keyword:'Get User Info Success', components:{} },result[0])
            } else {
                callback('0',{ keyword:'Failed!', components:{} },null)
            }
        });
    },


    contactUs: function (request, callback) { 
        const insrt = {
            email: request.email,
            subject: request.subject,
            description: request.description
        }
        con.query(`INSERT INTO tbl_contact_us SET ?`, insrt, function (err,result) { 
            if (!err && result.insertId > 0) {
                callback('1',{ keyword:'rest_success', components:{} },result)
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    getAboutUs: function (request, callback) { 
        con.query(`SELECT content FROM tbl_content_page WHERE page_name = 'about' AND is_active = '1' AND is_deleted = '0'`, function (err,result) { 
            if (!err) {
                callback('1',{ keyword:'rest_success', components:{} },result[0])
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    getTerms: function (request, callback) { 
        con.query(`SELECT content FROM tbl_content_page WHERE page_name = 'terms' AND is_active = '1' AND is_deleted = '0'`, function (err,result) { 
            if (!err) {
                callback('1',{ keyword:'rest_success', components:{} },result[0])
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    getPolicy: function (request, callback) { 
        con.query(`SELECT content FROM tbl_content_page WHERE page_name = 'policy' AND is_active = '1' AND is_deleted = '0'`, function (err,result) { 
            if (!err) {
                callback('1',{ keyword:'rest_success', components:{} },result[0])
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    getFaqs: function (request, callback) { 
        var query = `SELECT id, question, answer FROM tbl_faqs WHERE is_active = '1'`;
        con.query(query, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result)
                } else {
                    callback('2',{ keyword:'No Data Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },
   
    getCategoryList : function (request, callback) { 
        var query = `SELECT id, name, CONCAT('${GLOBALS.CATEGORY_IMAGE}', image) as image, IF((select count(id) from tbl_notification where is_read=0 and is_active=1 and receiver_id='${request.user_id}') > 0, 1, 0 ) as is_notify FROM tbl_category WHERE is_active = 1 and is_deleted=0 ORDER BY name ASC`;
        con.query(query, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result)
                } else {
                    callback('2',{ keyword:'No Data Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    getCatgoryProduct: function (request, callback) { 
        let query = `select p.*, CONCAT('${GLOBALS.PRODUCT_IMAGE}', p.image) as image, (select qty from tbl_cart where product_id=p.id AND user_id='${request.user_id}' AND is_active=1 and is_deleted=0) as quantity from tbl_product p where p.is_active=1 and p.is_deleted=0 `
	if(request.category_id != undefined && request.category_id != 0){
		query += ` AND p.category_id ='${request.category_id}' ORDER BY p.name ASC`	
	}else {
		query += ` ORDER BY p.name ASC`
	}
        con.query(query, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result)
                } else {
                    callback('2',{ keyword:'No Product on This Category', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    productDetails: function (request, callback) { 
        con.query(`SELECT p.*, c.name as category_name, CONCAT('${GLOBALS.PRODUCT_IMAGE}', p.image) as image, (select qty from tbl_cart where product_id='${request.id}' AND user_id='${request.user_id}' AND is_active=1 and is_deleted=0) as quantity, (select qty * p.price from tbl_cart where product_id='${request.id}' AND user_id='${request.user_id}' AND is_active=1 and is_deleted=0) as total_price, (select count(id) FROM tbl_prod_fav WHERE user_id='${request.user_id}' AND product_id='${request.id}') as is_liked FROM tbl_product p JOIN tbl_category c ON c.id = p.category_id WHERE p.is_active=1 and p.is_deleted=0 and c.is_deleted=0 and p.id='${request.id}'`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result[0])
                } else {
                    callback('2',{ keyword:'No Product Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },
    

    notificationList: function (request, callback) { 
        con.query(`select id, title, message, inserted_at from tbl_notification where is_active=1 and is_deleted=0 and receiver_id = '${request.user_id}' ORDER BY inserted_at DESC`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result)
                } else {
                    callback('2',{ keyword:'No Notification Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    readNotification: function (request, callback) { 
        con.query(`UPDATE tbl_notification SET is_read = 1 where is_active=1 and is_deleted=0 and receiver_id = '${request.user_id}'`, function (err,result) { 
            if (!err && result.affectedRows > 0) {
                callback('1',{ keyword:'rest_success', components:{} },result)
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },


    addToCart: function(request, callback) {

        con.query(`SELECT * from tbl_cart WHERE user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    const qtyin = {
                        qty: ++result[0].qty
                    }
                    con.query(`UPDATE tbl_cart SET ? WHERE id='${result[0].id}'`, qtyin, function (err2,res2) { 
                        if (!err2 && res2.affectedRows > 0) {
                            callback('1',{ keyword:'rest_success', components:{} },res2)
                        } else {
                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                        }
                    })
                } else {
                    const insetr ={
                        user_id: request.user_id,
                        product_id: request.id,
                        qty:1
                    }
                    con.query(`INSERT INTO tbl_cart SET ?`, insetr,function (err1,res1) { 
                        if (!err1 && res1.insertId > 0) {
                            callback('1',{ keyword:'rest_success', components:{} },res1)
                        } else {
                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                        }
                    })
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

cartWithQuantity: function(request, callback){
	 con.query(`SELECT * from tbl_cart WHERE user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                   if(request.tag == 'remove'){
		   	con.query(`delete from tbl_cart where user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`,function (err1,res1) { 
                        if (!err1 && res1.affectedRows > 0) {
                            callback('1',{ keyword:'rest_success', components:{} },res1)
                        } else {
                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                        }
                    })
		   }else{
		   con.query(`update tbl_cart set qty='${request.qty}' WHERE user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`,function (err1,res1) { 
                        if (!err1 && res1.affectedRow > 0) {
                            callback('1',{ keyword:'rest_success', components:{} },res1)
                        } else {
                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                        }
                    })
		   }
                } else {
                    const insetr ={
                        user_id: request.user_id,
                        product_id: request.id,
                        qty: request.qty
                    }
                    con.query(`INSERT INTO tbl_cart SET ?`, insetr,function (err1,res1) { 
                        if (!err1 && res1.insertId > 0) {
                            callback('1',{ keyword:'rest_success', components:{} },res1)
                        } else {
                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                        }
                    })
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
},

    removeCart: function (request, callback) { 
        con.query(`SELECT * from tbl_cart WHERE user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    if (result[0].qty > 1) {
                        const qtyin = {
                            qty: --result[0].qty
                        }
                        con.query(`UPDATE tbl_cart SET ? WHERE id='${result[0].id}'`, qtyin, function (err2,res2) { 
                            if (!err2 && res2.affectedRows > 0) {
                                callback('1',{ keyword:'rest_success', components:{} },res2)
                            } else {
                                callback('0',{ keyword:'rest_key_failed', components:{} },null)
                            }
                        })
                    } else {
                        con.query(`DELETE FROM tbl_cart WHERE id='${result[0].id}'`, function (err1,res1) { 
                            if (!err1 && res1.affectedRows > 0) {
                                callback('1',{ keyword:'rest_success', components:{} },res1)
                            } else {
                                callback('0',{ keyword:'rest_key_failed', components:{} },null)
                            }
                        })
                    }
                } else {
                    callback('0',{ keyword:'No Product Found On Cart', components:{} },null)
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

deleteFromCart : function(request, callback){
	con.query(`SELECT * from tbl_cart WHERE user_id = '${request.user_id}' AND product_id='${request.id}' AND is_active=1 AND is_deleted=0`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    
                        con.query(`DELETE FROM tbl_cart WHERE id='${result[0].id}'`, function (err1,res1) { 
                            if (!err1 && res1.affectedRows > 0) {
                                callback('1',{ keyword:'rest_success', components:{} },res1)
                            } else {
                                callback('0',{ keyword:'rest_key_failed', components:{} },null)
                            }
                        })
                } else {
                    callback('2',{ keyword:'No Product Found On Cart', components:{} },null)
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
},

    searchProduct: function (request, callback) { 
        let query = `select p.*, CONCAT('${GLOBALS.PRODUCT_IMAGE}', p.image) as image, (select qty from tbl_cart where product_id=p.id AND user_id='${request.user_id}' AND is_active=1 and is_deleted=0) as quantity from tbl_product p where p.is_active=1 and p.is_deleted=0 AND p.name LIKE '%${request.search}%'`
        
        if(request.category_id != undefined && request.category_id != 0) {
            query += ` AND p.category_id ='${request.category_id}'`
        }

        if(request.price_start != undefined && request.price_start != 0 && request.price_end != undefined && request.price_end != 0) {
            query += ` AND p.price between '${request.price_start}' AND '${request.price_end}'`
        }

        con.query(query, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    callback('1',{ keyword:'rest_success', components:{} },result)
                } else {
                    callback('2',{ keyword:'No Product Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    viewCart: function (request, callback) { 
        let query = `SELECT p.id, p.name, p.price,CONCAT('${GLOBALS.PRODUCT_IMAGE}', p.image) as image, p.qty, c.qty as quantity, p.price * c.qty as total_price, (select address from tbl_user where id = '${request.user_id}') as address, (select business_name from tbl_user where id = '${request.user_id}') as business_name from tbl_cart c JOIN tbl_product p ON c.product_id = p.id where c.user_id='${request.user_id}' AND c.is_active=1 and c.is_deleted=0`

        con.query(query, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    const finas = {}
                    finas.address = result[0].address
                    finas.product = result.filter(e=> delete e.address)
                  //  finas.payment_surcharge = result.map(e=>  e.total_price).reduce((a, b) => a + b)
		const net_price = result.map(e=>  e.total_price).reduce((a, b) => a + b)
                    finas.shipping_charge = Number(process.env.SHIP)
                    finas.tax = (net_price / (1 + Number(process.env.TAX))).toFixed(2)
			finas.payment_surcharge = (Number(net_price) - Number(finas.tax)).toFixed(2)
		    //finas.tax = taxvalue.toFixed(2)
                   // finas.total_payout = finas.payment_surcharge + finas.shipping_charge + finas.tax
			finas.total_payout = Number(finas.payment_surcharge) + Number(finas.tax)
                    callback('1',{ keyword:'rest_success', components:{} },finas)
                } else {
                    callback('2',{ keyword:'Your Cart is Empty', components:{} },{})
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },


    confirmOrder: function (request, callback) { 
        try {
            Auth.viewCart(request, function (code, msg,data) { 
                if (code != 0 && code != 2) {
    
                    let ordernum;
                    let orderdetail;
                    con.query('SELECT id, order_id FROM tbl_order ORDER BY order_id DESC', (err, rows) => {
                        try {
                            if (rows.length > 0) {
                                 ordernum = common.genOrderId(rows[0].order_id);
                                // Use ordernum for further processing
                            } else {
                                ordernum = common.genOrderId("000") ;
                            }
                             orderdetail = {
                                user_id: request.user_id,
                                order_id: ordernum,
                                product_id: (data.product.map(e => e.id)).toString(),
                                deliver_datetime: request.datetime,
                                address: data.address,
                                status: 'Order Placed',
                                payment_surcharge: data.payment_surcharge,
                                shipping: data.shipping_charge,
                                tax: data.tax,
                                total_payout: data.total_payout,
                            }
    
                            asyncLoop(data.product, function (item, next){
                                const ordededa = {
                                    user_id: request.user_id,
                                    order_id: ordernum,
                                    product_id: item.id,
                                    qty: item.quantity,
                                    price:item.price
                                }
                                con.query(`INSERT INTO tbl_order_detail SET ?`, ordededa, function (errx,resx) {                         
                                    next();
                                })
                            });
            
                            con.query(`INSERT INTO tbl_order SET ?`,orderdetail,  function (err,result) { 
                                if (!err && result.insertId > 0) {
                                    con.query(`UPDATE tbl_cart SET is_active=0, is_deleted=1 WHERE user_id='${request.user_id}' AND is_active=1 AND is_deleted=0`, function (err1,res1) {
                                        if (!err1 && res1.affectedRows > 0) {
                                            const insernoti = {
                                                receiver_id: request.user_id,
                                                title:'order',
                                                message:`Your $`+(Math.round(data.total_payout * 100) / 100).toFixed(2)+` order has been successfully placed!` 
                                            }
                                            common.insertNotification(insernoti, function (notidat) {  
                                                callback('1',{ keyword:'Your Order was successfully placed', components:{} },result)
                                            })
                                        } else {
                                            callback('0',{ keyword:'rest_key_failed', components:{} },null)
                                        }
                                    })
                                } else {
                                    callback('0',{ keyword:'rest_key_failed', components:{} },null)
                                }
                            })
                        } catch (err) {
                            console.log("🚀 ~ err:", err)
                        }
                    });
                   
                } else {
                    callback('0',{ keyword:'rest_key_failed', components:{} },null)
                }
            })
        } catch (error) {
            console.log("🚀 ~ error:", error)
            
        }
       
    },

    upcomingOrder: function (request, callback) { 
        con.query(`SELECT date(inserted_at) as date from tbl_order where user_id = '${request.user_id}' and is_active=1 and is_deleted=0 AND inserted_at > CURDATE() group by date(inserted_at) ORDER BY inserted_at DESC`, function (err,result) { 
            if (!err) {
                console.log("🚀 ~ result:", result)
                if (result[0] != undefined) {
                    var xyz = []
                    asyncLoop(result, function (item, next){
                        con.query(`select o.id, o.order_id, o.total_payout, o.status, DATE_FORMAT(o.deliver_datetime, '%d %b, %Y %h:%i %p') as deliver_datetime, o.product_id, DATE_FORMAT(o.inserted_at, '%d %b, %Y %h:%i %p') as order_date from tbl_order o where o.user_id='${request.user_id}' and date(o.inserted_at) = '${item.date}' AND o.is_active=1 and o.is_deleted=0 ORDER BY order_id DESC`, function (err1,res1) { 
                            console.log("🚀 ~ res1:", res1)
                            item.orderDate = res1
                            xyz.push(res1)
                            next();
                        })
                    }, function (){
                        asyncLoop(xyz.flat(), function (item, next){
                            Auth.productImagGetMul(item.product_id, function (imgdata) {
                                item.image = imgdata
                                next();
                            })
                        }, function (){
                            callback('1',{ keyword:'rest_success', components:{} },result)
                        });
                    });
                } else {
                    callback('2',{ keyword:'NO Upcoming Order', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    productImagGetMul: function (request, callback) { 
        con.query(`SELECT CONCAT('${GLOBALS.PRODUCT_IMAGE}', image) as image from tbl_product WHERE id in (${request})`, function (err,result) { 
            if (!err) {
                callback(result)
            } else {
                callback([])
            }
        })
    },

    pastOrder: function (request, callback) { 
        con.query(`SELECT date(inserted_at) as date from tbl_order where user_id = '${request.user_id}' and is_active=1 and is_deleted=0 AND date(deliver_datetime) < CURDATE() group by date(inserted_at) ORDER BY date(inserted_at) DESC`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    var xyz = []
                    asyncLoop(result, function (item, next){
                        con.query(`select o.id, o.order_id, o.total_payout, o.status, DATE_FORMAT(o.deliver_datetime, '%d %b, %Y - 12:00 PM') as deliver_datetime, o.product_id, DATE_FORMAT(o.inserted_at, '%d %b, %Y') as order_date from tbl_order o where o.user_id='${request.user_id}' and date(o.inserted_at) = '${item.date}' AND o.is_active=1 and o.is_deleted=0`, function (err1,res1) { 
                            item.orderDate = res1
                            xyz.push(res1)
                            next();
                        })
                    }, function (){
                        asyncLoop(xyz.flat(), function (item, next){
                            Auth.productImagGetMul(item.product_id, function (imgdata) {
                                item.image = imgdata
                                next();
                            })
                        }, function (){
                            callback('1',{ keyword:'rest_success', components:{} },result)
                        });
                    });
                } else {
                    callback('2',{ keyword:'NO Past Order', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    orderDetails: function (request, callback) { 
        con.query(`select o.order_id,o.total_payout, o.status, o.payment_surcharge,o.shipping, o.tax,o.cancel_reason, o.address, DATE_FORMAT(o.deliver_datetime, '%d %b, %Y - 12:00 PM') as deliver_datetime from tbl_order o where o.order_id = '${request.id}' and o.user_id = '${request.user_id}'`, function (err,result) { 
            if (!err && result[0] != undefined) {
                con.query(`select p.name, CONCAT('${GLOBALS.PRODUCT_IMAGE}', p.image) as image, d.price, p.qty, d.qty as quantity from tbl_order_detail d JOIN tbl_product p ON d.product_id = p.id WHERE d.order_id = '${request.id}'`, function (err1,res1) { 
                    if (!err1) {
                        result[0].productDetails = res1
                        callback('1',{ keyword:'rest_success', components:{} },result[0])
                    } else {
                        callback('0',{ keyword:'rest_key_failed', components:{} },null)
                    }
                })
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    cancelOrder: function (request, callback) { 
        con.query(`select * from tbl_order where order_id='${request.id}' AND user_id='${request.user_id}'`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    console.log(result[0].status)
                    if(result[0].status == 'Order Placed'){
                        con.query(`UPDATE tbl_order SET cancel_reason='${request.reason}', description='${request.description}', status='Order Cancelled' WHERE order_id='${request.id}' AND user_id='${request.user_id}'`, function (err1,res1) { 
                            if (!err1 && res1.affectedRows > 0) {
                                callback('1',{ keyword:'Your Order Has been Cancel', components:{} },[])
                            } else {
                                callback('0',{ keyword:'rest_key_failed', components:{} },null)
                            }
                        })
                    } else {
                        callback('1',{ keyword:"Your Order is accepted, you can't cancel order", components:{} },result)
                    }
                } else {
                    callback('2',{ keyword:'No Order Found', components:{} },[])
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    addToFavRemv: function (request, callback) {  
        con.query(`SELECT * FROM tbl_prod_fav WHERE user_id='${request.user_id}' AND product_id='${request.product_id}'`, function (err,result) { 
            if (!err) {
                if (result[0] != undefined) {
                    con.query(`delete from tbl_prod_fav where user_id='${request.user_id}' AND product_id='${request.product_id}'`, function (err1, res1) { 
                        callback('1',{ keyword:'Remove from Favorite Success', components:{} },res1)
                    })
                } else {
                    con.query(`INSERT INTO tbl_prod_fav SET user_id='${request.user_id}' , product_id='${request.product_id}'`, function (err1, res1) { 
                        callback('1',{ keyword:'Add to Favorite Success', components:{} },res1)
                    })
                }
            } else {
                callback('0',{ keyword:'rest_key_failed', components:{} },null)
            }
        })
    },

    cmsPage: function (request, callback) {
        if (request.tag == 'faq') {
            con.query("SELECT * FROM tbl_faqs WHERE is_active = 1 AND is_deleted = 0", function (err, result) {
                if (!err && result[0] != undefined) {
                    var response = {}
                    response.faq = result
                    response.title = 'faqs'
                    callback('1', {
                        keyword: 'Success',
                        components: {}
                    }, response);
                } else {
                    callback('0', {
                        keyword: 'Failed',
                        components: {}
                    }, null);
                }
            })
        } else {
            con.query("SELECT * FROM tbl_content_page WHERE page_name='" + request.tag + "'", function (err, result) {
                if (!err && result[0] != undefined) {
                    callback('1', {
                        keyword: 'Success',
                        components: {}
                    }, result[0]);
                } else {
                    callback('0', {
                        keyword: 'Failed',
                        components: {}
                    }, null);
                }
            })
        }
    },


    Get_S3_Url: (req, callback) => {
        let body = req;
        const fileName = body.bucketFolderName + '/' + Math.floor(10000 + Math.random() * 90000) + moment().utc().format("X") + '.' + body.fileType;

        let awsfiletype = "image/";

        const s3Params = {
            Bucket: 'ballians3',
            Key: fileName,
            ContentType: awsfiletype + body.fileType,
            Expires: 60 * 60,
            ACL: "public-read"
        }

        s3.getSignedUrl('putObject', s3Params, (err, result) => {
            if (err) {
                callback("0", { keyword: "failed", components: {} }, null);
            } else {
                callback("1", { keyword: "success", components: {} }, result);
            }
        });
    },

}

module.exports = Auth;
