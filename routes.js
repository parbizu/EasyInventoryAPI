const AWS = require('aws-sdk');
const express = require('express');
const uuid = require('uuid');

const IS_OFFLINE = process.env.NODE_ENV !== 'production';
const EMPLOYEES_TABLE = process.env.TABLE;

const dynamoDb = IS_OFFLINE === true ?
    new AWS.DynamoDB.DocumentClient({
        region: 'eu-west-2',
        endpoint: 'http://127.0.0.1:8080',
    }) :
    new AWS.DynamoDB.DocumentClient();

const router = express.Router();

router.get('/productos/:id', (req, res) => {
    
    var docClient = new AWS.DynamoDB.DocumentClient();
   
   let uid = req.params.id;

   var params = {
     TableName: "productos",
     IndexName: "uid-index",
     KeyConditionExpression: "uid = :p",
     ExpressionAttributeValues: {
         ":p": uid
     },  
   };
 
   res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
    'Access-Control-Allow-Headers': 'Content-Type'
   })


   docClient.query(params, function(err, data) {
    if (err) {
        res.status(400).json({ err: err });
    }else{
        if (data)
            res.json(sort_by_key(data.Items, 'nombre'));
            
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



router.post('/validate', (req, res) => {
    
    const parametro = req.body.parametro;
    const clave = req.body.clave

    var docClient = new AWS.DynamoDB.DocumentClient();

    var status_KO = {
        status:'KO'
    };

    var status_OK = {
        status:'OK'
    };
   
    
    var params = {
      TableName: "usuarios",
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :p",
      ExpressionAttributeValues: {
          ":p": parametro
      },  
    };

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
        'Access-Control-Allow-Headers': 'Content-Type'
      })

        
      docClient.query(params, function(err, data) {
        if (err) {
            res.status(400).json({ err: err });
        }else{
            console.log(data.Items[0])
            if (data.Items[0]){
                
                if(data.Items[0].code===clave)
                    res.json(status_OK)
                else
                    res.json(status_KO)

            }else 
                res.json(status_KO)
        }
        });

});


router.post('/producto', (req, res) => {
    
    const nombre = req.body.nombre.toUpperCase();
    const precio = req.body.precio;
    const uid = req.body.uid;
    const id = uuid.v4();

    const params = {
        TableName: EMPLOYEES_TABLE,
        Item: {
            id,
            nombre,
            precio,
            uid
        },
    };

    res.set({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
  'Access-Control-Allow-Headers': 'Content-Type'
})

    dynamoDb.put(params, (error) => {
        if (error) {
            res.status(400).json({ error: 'Error al crear producto' });
        }
        res.json({
            id,
            nombre
        });
    });
});


router.delete('/productos', (req, res) => {
    
var itemsArray = req.body;

var params = {
    RequestItems : {
        'productos' : itemsArray
    }
};

    res.set({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
        'Access-Control-Allow-Headers': 'Content-Type'
      })


      dynamoDb.batchWrite(params, function(err, data) {
        if (err) {
            console.log('Batch delete unsuccessful ...');
            console.log(err, err.stack); // an error occurred
            res.status(400).json({ error: 'Could not update Employee' });
        } else {
            console.log('Batch delete successful ...');
            console.log(data); // successful response
            res.json({
                resultado : data 
                });
        }
    });  

});


router.post('/productos', (req, res) => {
    
    var itemsArray = req.body;
    
    var params = {
        RequestItems : {
            'productos' : itemsArray
        }
    };

        res.set({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
            'Access-Control-Allow-Headers': 'Content-Type'
          })
    
    
          dynamoDb.batchWrite(params, function(err, data) {
            if (err) {
                console.log('Batch delete unsuccessful ...');
                console.log(err, err.stack); // an error occurred
                res.status(400).json({ error: 'Could not update Employee' });
            } else {
                console.log('Batch delete successful ...');
                console.log(data); // successful response
                res.json({
                    resultado : data 
                    });
            }
        });  
    
});


router.put('/producto', (req, res) => {
    
    const nombre = req.body.nombre.toUpperCase();
    const precio = req.body.precio;
    const id = req.body.id;

   
   

    const params = {
        TableName: EMPLOYEES_TABLE,
        Key: {
            id
        },
        UpdateExpression: 'set nombre = :nombre,precio = :precio',
        ExpressionAttributeValues:{
          ":nombre":nombre,
          ":precio":precio
        },
        ReturnValues: "ALL_NEW"
    }

    res.set({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://producto.asistente.ai',
  'Access-Control-Allow-Headers': 'Content-Type'
})
    

    dynamoDb.update(params, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not update Employee' });
        }else{

            res.json({
            resultado : result 
            });

        }
        
        

    })    
});






module.exports = router;
