'use strict';

const sdk = require('api')('@docs-dlocal/v2.1#3hz4uc1tl09mpmx4');
const express = require('express');
const router = express.Router();
const validator = require('validator');

router.get('/', (req, res, next) => {
    res.redirect(301, '/checkout');
});

router.get('/checkout', (req, res, next) => {
    res.render('index', {
       title: 'Checkout',
       section: 'info'
    });
});

router.get('/callback', (req, res, next) => {
    console.log("Llego el callback de dlocal")
    console.log(req)
});

router.get('/payin_notification', (req, res, next) => {
    console.log("Llego la notificacion depayin de dlocal")
    console.log(req)
});

router.get('/refunds_notification', (req, res, next) => {
    console.log("Llego la notificacion depayin de dlocal")
    console.log(req)
});

router.get('/billing-shipping', (req, res, next) => {
    if(req.session.user) {
        res.render('billing-shipping', {
            title: 'Billing and shipping',
            section: 'billing',
            user: req.session.user
        });
    } else {
        res.redirect('/checkout');
    }
});

router.get('/payment', (req, res, next) => {
    if(!req.session.user) {
        res.redirect('/checkout');
        return;
    }

    const { user } = req.session;

    if(!user.billing) {
        res.redirect('/billing-shipping');
        return;
    }

    res.render('payment', {
        title: 'Payment',
        section: 'payment',
        user
    });
});

router.get('/thank-you', (req, res, next) => {
    if(req.session.user && req.session.user.billing) {
        res.render('thank-you', {
            title: 'Order complete',
            section: 'thank-you',
            user: req.session.user
        });
    } else {
        res.redirect('/checkout');
    }
});

router.post('/billing-shipping', (req, res, next) => {
    const post = req.body;
    const errors = [];

    if(validator.isEmpty(post.billing_first_name)) {
        errors.push({
            param: 'billing_first_name',
            msg: 'Required field.'
        });
    }
    if(validator.isEmpty(post.billing_last_name)) {
        errors.push({
            param: 'billing_last_name',
            msg: 'Required field.'
        });
    }
    if(!validator.isEmail(post.billing_email)) {
        errors.push({
            param: 'billing_email',
            msg: 'Invalid e-mail address.'
        });
    }

    if(validator.isEmpty(post.billing_address)) {
        errors.push({
            param: 'billing_address',
            msg: 'Required field.'
        });
    }

    if(validator.isEmpty(post.billing_city)) {
        errors.push({
            param: 'billing_city',
            msg: 'Required field.'
        });
    }

    if(!validator.isNumeric(post.billing_zip)) {
        errors.push({
            param: 'billing_zip',
            msg: 'Invalid postal code.'
        });
    }

    if(!post.same_as) {
        if(validator.isEmpty(post.shipping_first_name)) {
            errors.push({
                param: 'shipping_first_name',
                msg: 'Required field.'
            });
        }
        if(validator.isEmpty(post.shipping_last_name)) {
            errors.push({
                param: 'shipping_last_name',
                msg: 'Required field.'
            });
        }
        if(!validator.isEmail(post.shipping_email)) {
            errors.push({
                param: 'shipping_email',
                msg: 'Invalid e-mail address.'
            });
        }
    
        if(validator.isEmpty(post.shipping_address)) {
            errors.push({
                param: 'shipping_address',
                msg: 'Required field.'
            });
        }
    
        if(validator.isEmpty(post.shipping_city)) {
            errors.push({
                param: 'shipping_city',
                msg: 'Required field.'
            });
        }
    
        if(!validator.isNumeric(post.shipping_zip)) {
            errors.push({
                param: 'shipping_zip',
                msg: 'Invalid postal code.'
            });
        }
    }

    if(errors.length > 0) {
        res.json({ errors });
    } else {
        const billing = {};
        

        for(let prop in post) {
            if(prop.startsWith('billing')) {
                let key = prop.replace('billing', '').replace(/_/g, '');
                billing[key] = post[prop];
            }
        }

        req.session.user.billing = billing;

        if(!post.same_as) {
            const shipping = {};

            for(let prop in post) {
                if(prop.startsWith('shipping')) {
                    let key = prop.replace('shipping', '').replace(/_/g, '');
                    shipping[key] = post[prop];
                }
            }

            req.session.user.shipping = shipping;
        }

        res.json({ saved: true });
    }
});

router.post('/login', (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if(!validator.isEmail(email)) {
        errors.push({
            param: 'email',
            msg: 'Invalid e-mail address.'
        });
    }

    if(validator.isEmpty(password)) {
        errors.push({
            param: 'password',
            msg: 'Invalid password.'
        });
    }

    if(errors.length) {
        res.json({ errors });
    } else {
        if(!req.session.user) {
            req.session.user = { email };
        }
        res.json({ loggedIn: true });
    }
});

router.post('/generate_payment', (req, res, next) => {
    var ts = new Date()
    //Signature: <hmac(secretKey, "X-Login+X-Date+RequestBody")>
    var rqb = {
        payer: {
            name: 'Thiago Gabriel',
            email: 'thiago@example.com',
            document: '53033315550',
            user_reference: '12345',
            address: {
                state: 'Rio de Janeiro',
                city: 'Volta Redonda',
                zip_code: '27275-595',
                street: 'Servidao B-1',
                number: '1106'
            }
        },
        card: {
            installments: '1',
            capture: true,
            save: true,
            holder_name: 'Thiago Gabriel',
            number: '4111111111111111',
            cvv: '123',
            expiration_month: 10,
            expiration_year: 2040
        },
        amount: 120,
        currency: 'USD',
        country: 'BR',
        payment_method_id: 'VD',
        payment_method_flow: 'DIRECT',
        order_id: '657434343',
        notification_url: 'http://merchant.com/notifications'
    }
    var hash = crypto.createHmac('sha1', '3u7oMIFRoKCjGJfGTvaElJHWomp2S5jtj').update("1KzPFoQJaI2022-03-23T13:46:28.629Z"+rqb).digest().toString('base64')
    sdk['create-payment'](rqb, {
        'X-Date': ts,
        'X-Login': '1KzPFoQJaI',
        'X-Trans-Key': 'JqnkIujx9Z',
        'X-Version': '2.1',
        'User-Agent': 'MerchantTest / 1.0',
        Authorization: hash
    })
        .then(res => console.log("OK"+res))
        .catch(err => console.error("FAIL"+err));
});

router.post('/register', (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if(validator.isEmpty(name)) {
        errors.push({
            param: 'name',
            msg: 'Invalid name.'
        });
    }

    if(!validator.isEmail(email)) {
        errors.push({
            param: 'email',
            msg: 'Invalid e-mail address.'
        });
    }

    if(validator.isEmpty(password)) {
        errors.push({
            param: 'password',
            msg: 'Invalid password.'
        });
    }

    if(errors.length) {
        res.json({ errors });
    } else {
        if(!req.session.user) {
            req.session.user = { name, email };
        }
        res.json({ registered: true });
    }
});
module.exports = router;
