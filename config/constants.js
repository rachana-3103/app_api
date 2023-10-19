let Globals = {
    'APP_NAME':'Ballina',
    'API_KEY':process.env.API_KEY,
    'KEY':process.env.KEY,
    'IV':process.env.IV,
    'BASE_URL'              : process.env.BASE_URL,
    'BASE_URL_WITHOUT_API'  : process.env.BASE_URL_WITHOUT_API,
    'PORT_BASE_URL'         : process.env.PORT_BASE_URL,
    'S3_BUCKET_ROOT'        : process.env.S3_BUCKET_ROOT,
    'API_PASSWORD'          : process.env.API_PASSWORD,
    'USER_IMAGE'            : process.env.USER_IMAGE,
    'PRODUCT_IMAGE'         : 'https://ballians3.s3.amazonaws.com/product/',
    'CATEGORY_IMAGE'        : 'https://ballians3.s3.amazonaws.com/category/',
    'STORE_IMAGE'           : process.env.STORE_IMAGE,
    'OFFER_IMAGE'           : process.env.OFFER_IMAGE,
    'BANNER_IMAGE'          : process.env.BANNER_IMAGE,
    'DOCUMNET'		     : process.env.DOCUMNET,
    'NOTIFICATION'	     : process.env.NOTIFICATION,
    'KEY_ID'             :'',
    'TEAM_ID'            : ''
}

module.exports = Globals
