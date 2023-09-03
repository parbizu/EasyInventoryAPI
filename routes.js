const AWS = require('aws-sdk');
const express = require('express');
const uuid = require('uuid');

var nodemailer = require("nodemailer");
const Email = require('email-templates');

const json2csv = require('json2csv').parse;
const fs = require('fs');

var ses = new AWS.SES({region: 'us-east-1'});
var transporter = nodemailer.createTransport({
    SES: ses
  });

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const router = express.Router();

router.get('/preguntas/:cuenta', (req, res) => {
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    let cuenta = req.params.cuenta;

    var params = {
     TableName: "preguntas",
     IndexName: "cuenta-index",
     KeyConditionExpression: "cuenta = :cuenta",
     ExpressionAttributeValues: {
         ":cuenta": cuenta
     },  
    };


 
   res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
   })

   
   docClient.query(params, function(err, data) {
    if (err) {
        res.status(400).json({ err: err });
    }else{
        if (data)
            res.json(sort_by_key(data.Items, 'tipo'));
            
        else
            res.json([]);

    }
    });

});

router.get('/inventories/:userId', (req, res) => {
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    let userId = req.params.userId;

    var params = {
     TableName: "sw_inventories",
     IndexName: "userId-index",
     KeyConditionExpression: "userId = :userId",
     ExpressionAttributeValues: {
         ":userId": userId
     },  
    };


 
   res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
   })

   
   docClient.query(params, function(err, data) {
    if (err) {
        res.status(400).json({ err: err });
    }else{
        if (data)
            res.json(sort_by_key(data.Items, 'category'));
            
        else
            res.json([]);

    }
    });

});


router.get('/pregunta/:id', (req, res) => {
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    let id = req.params.id;

    var params = {
     TableName: "preguntas",
     IndexName: "id-index",
     KeyConditionExpression: "id = :id",
     ExpressionAttributeValues: {
         ":id": id
     },  
    };


 
   res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
   })

   
   docClient.query(params, function(err, data) {
    if (err) {
        res.status(400).json({ err: err });
    }else{
        if (data)
            res.json(data.Items[0]);
            
        else
            res.json([]);

    }
    });

});


router.get('/item/:id', (req, res) => {
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    let id = req.params.id;

    var params = {
     TableName: "sw_items",
     IndexName: "id-index",
     KeyConditionExpression: "id = :id",
     ExpressionAttributeValues: {
         ":id": id
     },  
    };

 
   res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
   })

   
   docClient.query(params, function(err, data) {
    if (err) {
        res.status(400).json({ err: err });
    }else{
        if (data)
            res.json(data.Items[0]);
            
        else
            res.json([]);

    }
    });

});


function sort_by_key(array, key)
{
 return array.sort(function(a, b)
 {
  var x = a[key]; var y = b[key];
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
 });
}



router.post('/sendInventory', async (req, res) => {
    
    const userId = req.body.userId;
    const email = req.body.email;
    let items = await getInventories(userId)
    let attachments = await getInventoryFile (items)
   
    res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
    })

    let appPath = __dirname

    const emailt = new Email({
        transport: transporter,
        send: true,
        preview: false,
        views: {root : appPath +'/emails/es-MX'}
      });
      emailt.send({
        template: 'help',
        message: {
          from: 'notifications@asistente.ai',
          to: email,
          attachments: attachments
        }
      }).then(() => {
        console.log("Sent register email.")
        res.json({
            resultado : 'OK' 
            });
      }).catch((err) => {
        console.error("Error sending register email: " + err)
        res.json({
            resultado : 'KO' 
            });
      });  

});

async function getInventoryFile(items){

    var fields = ['category','product','quantity']
    const opts = {
        fields
    };

    const csv = json2csv(items, opts);
    var filename = Date.now();
    var path = '/tmp/' + filename + '.csv';

    console.log('path:'+path)

    return new Promise(function(resolve, reject) {

    fs.writeFile(path, csv, function (err, data) {
        if (err) {
            console.log('err:'+err)
            reject(err)
            throw err;
        } else {

          var attachments = [{ // file on disk as an attachment
            filename: filename+'.csv',
            path: '/tmp/'+filename+'.csv' // stream this file
          }]
          
          resolve(attachments);
        
            }
        });
    });

}



async function getInventories(userId){

    var docClient = new AWS.DynamoDB.DocumentClient();
  
    var params = {
     TableName: "sw_inventories",
     IndexName: "userId-index",
     KeyConditionExpression: "userId = :userId",
     ExpressionAttributeValues: {
         ":userId": userId
     },  
    };

 
    return new Promise(function(resolve, reject) {

        docClient.query(params, function(err, data) {
            if (err) {
                reject({ err: err });
            }else{
                if (data)
                resolve(sort_by_key(data.Items, 'category'));
                else
                    resolve([]);
            }
            });
        
 
    });

}

router.put('/pregunta', (req, res) => {
    
    const pregunta = req.body.pregunta;
    const codigo = req.body.codigo;
    const id = req.body.id;

   
    const params = {
        TableName: "preguntas",
        Key: {
            id
        },
        UpdateExpression: 'set pregunta = :pregunta,codigo = :codigo',
        ExpressionAttributeValues:{
          ":pregunta":pregunta,
          ":codigo":codigo
        },
        ReturnValues: "ALL_NEW"
    }
    

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
       })
    

    dynamoDb.update(params, (error, result) => {

        console.log('adadda')
        if (error) {       
         console.log(error);
         //reject(error);
         res.status(400).json({ error: 'Could not update Employee' });
        }else{
            res.json({
                resultado : result 
                });
        }
     }); 
         
});



router.put('/item', (req, res) => {
    
    const product = req.body.product;
    const quantity = req.body.quantity;
    const id = req.body.id;

   
    const params = {
        TableName: "sw_items",
        Key: {
            id
        },
        UpdateExpression: 'set product = :product,quantity = :quantity',
        ExpressionAttributeValues:{
          ":product":product,
          ":quantity":quantity
        },
        ReturnValues: "ALL_NEW"
    }
    

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
       })
    

    dynamoDb.update(params, (error, result) => {
        if (error) {       
        
         res.status(400).json({ error: 'Could not update Employee' });
        }else{
            res.json({
                resultado : result 
                });
        }
     }); 
         
});


module.exports = router;
