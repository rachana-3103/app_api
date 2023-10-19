require("dotenv").config();
var express     = require('express');
var middleware 	= require('./middleware/headerValidator');
app = express();
var cors = require('cors');


var apidoc = require('./modules/v1/api_document/index')
var customerauth = require('./modules/v1/customer/route');

app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(cors())


app.use('/v1/api_document/', apidoc);
app.use(middleware.extractHeaderLanguage);
app.use(middleware.validateHeaderApiKey);
app.use(middleware.validateHeaderToken);

app.use('/api/v1/auth/',customerauth);


try {
	server = app.listen(process.env.PORT);
	console.log("🚀🚀🚀🚀🚀Connected to ballina 🚀🚀🚀🚀🚀 : "+process.env.PORT);
} catch (err) {
	console.log("Failed to connect");
}
