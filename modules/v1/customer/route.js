var express = require('express');
var middleware = require('../../../middleware/headerValidator');
var customer_model = require('./customer_model');
const { required } = require('../../../languages/en');
var router = express.Router();

router.post('/signup', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {
            fname:'required',
            lname:'required',
            email:'required',
            password:'required',
            dob:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            customer_model.signupCustomer(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/login', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            email: 'required',
            password:'required',
        }
        const messages = {
            // 'required': req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            customer_model.checkLogin(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/verifyaccount/:token', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.verify_token = req.params.token
            customer_model.verifyAccount(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/editprofile', function (req, res) { 
    middleware.decryption(req, function (request) { 
        var rules = {
            profile_image:'',
            fname:'',
            lname:'',
            email:'',
            phone:'',
            address:''
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.editProfile(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/logout', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.logOut(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/forgotpassword', function (req, res) { 
    middleware.decryption(req, function (request) { 
        var rules = {
            email:'required',
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            customer_model.forgotPassword(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/changepassword', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {
            old_password:'required',
            new_password:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.changePassword(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/deleteaccount', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {}
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.deleteAccount(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/getuserprofile', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {}
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.getUserProfile(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/contactus', function (req, res) { 
    middleware.decryption(req, function (request) {
        var rules = {
            email:'required',
            subject:'required',
            description:'required',
        }
        const messages = {
            'required':req.language.required
        }

        if(middleware.checkValidationRules(request, res, rules, messages,{})){
            request.user_id = req.user_id
            customer_model.contactUs(request, function (responsecode, responsemsg, responsedata) { 
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/getaboutus', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {}
        if (middleware.checkValidationRules(request, res, rules, {})) {
            customer_model.getAboutUs(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/getterms', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {}
        if (middleware.checkValidationRules(request, res, rules, {})) {
            customer_model.getTerms(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/getpolicy', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {}
        if (middleware.checkValidationRules(request, res, rules, {})) {
            customer_model.getPolicy(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
})

router.post('/getfaqs', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {}
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.getFaqs(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/getcategorylist', function (req, res) {
    middleware.decryption(req, function (request) {

        if (middleware.checkValidationRules(request, res, {})) {
            request.user_id = req.user_id
            customer_model.getCategoryList(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/getcategoryproduct', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            category_id:''
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.getCatgoryProduct(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});


router.post('/productdetails', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            id:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.productDetails(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});


router.post('/notificatiolist', function (req, res) {
    middleware.decryption(req, function (request) {

        if (middleware.checkValidationRules(request, res, {})) {
            request.user_id = req.user_id
            customer_model.notificationList(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/readnotification', function (req, res) {
    middleware.decryption(req, function (request) {

        if (middleware.checkValidationRules(request, res, {})) {
            request.user_id = req.user_id
            customer_model.readNotification(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/addtocart', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            id:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.addToCart(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/cartwithquantity', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            id:'required',
	    qty:'required',
	    tag:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.cartWithQuantity(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/removecart', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            id:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.removeCart(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/deletefromcart', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            id:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.deleteFromCart(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/searchproduct', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            search: 'required',
            category_id:'',
            price_start:'',
            price_end:''
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.searchProduct(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/viewcart', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {}
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.viewCart(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/confirmorder', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            datetime:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            console.log("🚀 ~ request.user_id:", request.user_id)
            customer_model.confirmOrder(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/upcomingorder', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = { }
        const messages = {
            // 'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.upcomingOrder(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/pastorder', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = { }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.pastOrder(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/orderdetails', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = { 
            id:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.orderDetails(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/cancelorder', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = { 
            id:'required',
            reason:'required',
	    description:'required'
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.cancelOrder(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post('/addtofavoritermove', function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = { 
            product_id:'required',
        }
        const messages = {
            'required':req.language.required
        }

        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            request.user_id = req.user_id
            customer_model.addToFavRemv(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata)
            })
        }
    })
});

router.post("/cmsPage", function (req, res) {
    middleware.decryption(req, function (request) {
        var rules = {
            tag : 'required'
        }
        const messages = {
            'required': req.language.required
        }
        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            customer_model.cmsPage(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata);
            });
        }
    })
})

router.post("/Get_S3_Url", function (req, res) {
    middleware.decryption(req, function (request) {

        var rules = {
            fileType: "required",
            bucketFolderName: "required"
        }

        const messages = {
            'required': "You forgot the :attr field value"
        }


        if (middleware.checkValidationRules(request, res, rules, messages, {})) {
            customer_model.Get_S3_Url(request, function (responsecode, responsemsg, responsedata) {
                middleware.sendresponse(req, res, 200, responsecode, responsemsg, responsedata);
            });
        }
    });
});

module.exports = router;
