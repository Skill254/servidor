const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mysql = require("mysql");
const mysql2 = require("mysql2");
const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require('path');
const { text, rotate, scale, fontSize, moveDown } = require('pdfkit');
const { default: Api } = require('datatables.net');
const { each, $ } = require('jquery');
const nodemailer = require('nodemailer');
var xl = require('excel4node');
app.use(cors());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));
const Pmv = require('../servidor/pmv.js');
app.use(Pmv)
const db1 = mysql2.createPool({ host: '127.0.0.1', user: 'root', password: 'root', database: '' });
//const db = mysql.createPool({host: '192.168.20.95', user: 'admin', password: 'LmMG-45+', database: ''});
const db = mysql.createPool({ host: '172.16.251.2', user: 'dev.esilva', password: 'Esilva2022@', database: '', multipleStatements: true }); //UsuarioEduardo DEV
//const db = mysql.createPool({ host: '172.16.251.2', user: 'dev.dgarcia', password: 'D6x&gI2Wv@Rb58', database: '', })
//**Eduardo GET */
//Regresar datos estado


////******////****////******/CONSULTAS TABLERO DE USUARIOS/*******////******////****
//MODIFICADA//
app.get('/api/select_municipio/:id_estado', (req, res) => {
    const sqlSelect =
        //"select id_estado, id_municipio as value, nombre_municipio as label from  world.cat_municipio where id_estado=?  order by  nombre_municipio asc;"
        "select id_estado, id_municipio as value, nombre_municipio as label from  prod_ctls.cat_municipio where id_estado=?  order by  nombre_municipio asc"
    const id_estado = req.params.id_estado;
    db.query(sqlSelect, [id_estado], (err, result) => {
        res.send(result);
    });
});
app.post('/api/baja_usuario/:status/:email', (req, res) => {
    const status = req.body.status;
    const email = req.body.email;
    const sqlUpdate =
        "update prod_adms.cnfg_usuarios set status = ? where email = ?;"; //Producción
    //"update world.cnfg_usuarios set status = ? where email = ?;"; //LocalHost
    let b = db.query(sqlUpdate, [status, email],
        (err, result) => {
            console.log("RESULTADO: ", b)
            console.log(err)
            res.send(result);
        });
});
//**NUEVAS API´S 22/08/2022**/
//Integre esas Apis





/*APIS MODIFICADAS*/
app.get('/api/sesionTab_usr/:email/:psw', (req, res) => {
    const email = req.params.email;
    const psw = req.params.psw;
    const sqlSelect = "call prod_adms.sp_login(?, ?);"  //PRODUCCION   
    db.query(sqlSelect, [
        email, psw
    ], (err, result) => {
        console.log("RESULTADO", result);
        if (result[0].length !== 0) {
            res.send(result[0]);
            return true;
        }
        console.log("No Existe el registro");
        res.send("[{\"email\": \"INEXISTENTE\"\}]");

    });
});
app.get('/api/get_mdo/:email', (req, res) => {
    const email = req.params.email;
    const sqlSelect = "select * from(SELECT id_modulo As value, TRIM(SUBSTRING_INDEX(descripcion, '</i>', -1)) As label FROM prod_adms.cnfg_modulos where id_modulo in(select id_modulo from prod_adms.cnfg_permisos where email = ? and admin = '1'))x ORDER BY label ASC;"; //PRODUCCION
    //const sqlSelect = "select * from(SELECT id_modulo As value, TRIM(SUBSTRING_INDEX(descripcion, '</i>', -1)) As label FROM world.cnfg_modulos where id_modulo in(select id_modulo from world.cnfg_permisos where email = ? and admin = '1'))x ORDER BY label ASC;";  //LOCALHOST
    db.query(sqlSelect, [email], (err, result) => {
        console.log(err);
        if (result == "") {
            res.send("[{\"email\": \"INEXISTENTE\"\}]");
        } else {
            res.send(result);
            console.log("RESULTADO DEL MODULO", result)
        }

    });
});
app.get('/api/InsertaAlcance/:email/:modulo/:id_estado', (req, res) => {
    const email = req.params.email;
    const modulo = req.params.modulo;
    const id_estado = req.params.id_estado;
    ObtenerPermisoAlcances(email, modulo,
        function (result) {
            var id = result;
            const sqlSelect = "insert into prod_adms.cnfg_alcances (id,id_estado,cve_ps,status) values(?,?,NULL,'A');";  //PRODUCCION
            //const sqlSelect = "insert into world.cnfg_alcances (id,id_estado,cve_ps,status) values(?,?,NULL,'A');";   //LOCALHOST
            db.query(sqlSelect, [id, id_estado], (err, result) => {
                console.log(err)
                console.log(result)
                res.send(id + "_" + id_estado);


            });
        });
});
app.post('/api/post_rfc', (req, res) => {
    const email = req.body.email
    const rfc = req.body.rfc
    const Modulo = req.body.Modulo
    const status = req.body.status
    const Tipo = req.body.Tipo
    const admin = req.body.admin
    const cnfg_edo = req.body.cnfg_edo
    const cnfg_programa = req.body.cnfg_programa
    const sqlInsert = "call prod_adms.ins_servicio(?,?,?,?,?,?,?,?);";  //PRODUCCION
    //const sqlInsert = "call world.ins_servicio(?,?,?,?,?,?,?,?);";  //LOCALHOST
    //console.log("email: " + email);
    let a = db.query(sqlInsert, [
        email,
        rfc,
        Modulo,
        status,
        Tipo,
        admin,
        cnfg_edo,
        cnfg_programa],
        (err, result) => {
            res.send(result);
            //console.log(a)
            console.log(err)
            console.log(result)
            console.log("FUNCION PRESTADORES DE SERVICIOS");

        });

});
function ObtenerPermisoAlcances(email, permiso, callback) {
    const sqlSelect = "SELECT id FROM prod_adms.cnfg_permisos where id_modulo=? and email = ?;" //PRODUCCION 
    //const sqlSelect = "SELECT id FROM world.cnfg_permisos where id_modulo=? and email = ?;"  //LOCALHOST
    db.query(sqlSelect, [permiso, email], (err, result) => {
        return callback(result[0].id);
        console.log("RESULTADO DE ALCANCES", result[0].id)
    });
}
app.post('/api/post_loadusr', (req, res) => {
    const email = req.body.email
    const Modulo = req.body.Modulo
    const status = req.body.status
    const Tipo = req.body.Tipo
    const admin = req.body.admin
    const cnfg_edo = req.body.cnfg_edo
    const cnfg_programa = req.body.cnfg_programa
    //string consulta   
    const sqlInsert = "call prod_adms.loadUsr(?,?,?,?,?,?,?)";  //PRODUCCION
    //const sqlInsert = "call world.outi(?,?,?,?,?,?,?)"; //LOCALHOOST
    let a = db.query(sqlInsert, [
        email,
        Modulo,
        status,
        Tipo,
        admin,
        cnfg_edo,
        cnfg_programa,
        cnfg_edo,
        status,
        admin,
        Tipo,
        cnfg_programa],
        (err, result) => {
            console.log(a)
            res.send("[{\"OK\"\}]");
            console.log("REGISTRO GUARDADO CON EXITO(FUNCIÓN NORMAL)")
        });

});
app.get('/api/get_modTipo/:modulo', (req, res) => {
    const modulo = req.params.modulo;
    const sqlSelect = "SELECT us.acronimo as value,  us.descripcion as label FROM prod_adms.cnfg_tipo_usuario us inner join  prod_adms.cnfg_modulos md on md.id_modulo=us.id_modulo where us.id_modulo = ?;"  //PRODUCCION 
    //const sqlSelect = "SELECT us.acronimo as value,  us.descripcion as label FROM world.cnfg_tipo_usuario us inner join  world.cnfg_modulos md on md.id_modulo=us.id_modulo where us.id_modulo = ?;"  //LOCALHOST
    db.query(sqlSelect, [modulo], (err, result) => {
        console.log("Modulo de identificación: ", modulo)
        if (result == "") {
            res.send("No hay subModulos")
        } else {
            res.send(result);
            console.log("resultado: ", result)
        }
    });
});
app.get('/api/Select_estado', (req, res) => {
    const sqlSelect =
        "SELECT clave_estado as value ,estado as label FROM prod_pev.pev_exundi where clave_estado  group by estado, clave_estado order by estado asc"
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_modulos', (req, res) => {
    const sqlSelect =
        "select * from(SELECT id_modulo As value, TRIM(SUBSTRING_INDEX(descripcion, '</i>', -1)) As label FROM prod_adms.cnfg_modulos )x ORDER BY label ASC;"  // PRODUCCION
    //"select * from(SELECT id_modulo As value, TRIM(SUBSTRING_INDEX(descripcion, '</i>', -1)) As label FROM world.cnfg_modulos )x ORDER BY label ASC;"   //LOCALHOST
    db.query(sqlSelect, (err, result) => {

        res.send(result);



    });

});

/**MODIFICADA**/
function Expediente(nombre, apellidos, email) {
    var message = {
        from: "notifica@conavi.gob.mx",
        to: 'hbenitez@conavi.gob.mx',
        subject: "Alta Expediente Unico Digital",
        text: "Plaintext version of the message",
        html: "<p>TIENES UNA NUEVA SOLICITUD PARA ASIGNAR PERMISOS DEL EXPEDIENTE UNICO DIGITAL<br></p>" +
            " <span style='text-align:center;display:block;margin-top:5px'>" +
            "</span> <br><br> <table style='width:75%;'> <tr style='margin-bottom:12px;font-size:18px;'><td><b>Buen día,</b></td>  </tr>" +
            "<tr style='text-align:justify; height: 150px;'><td>" +
            "Tienes una nueva solicitud de usuario: <strong>" + nombre + " " + apellidos + "</strong>" +
            " para el Expediente Unico Digital 2023, con el correo: <strong> " + email + "</strong>  puede ingresar en el siguiente link para dar seguimiento a la solicitud: " +
            "https://sistemaintegral.conavi.gob.mx:81/TableroUsuarios/#/login</td></tr></table>" +
            "<p><b>NO RESPONDA ESTE CORREO, ES UN ENVÍO AUTOMATIZADO.</b></p>"
    };
    var transporter = nodemailer.createTransport({
        host: "mail.conavi.gob.mx",
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
            user: "notifica@conavi.gob.mx",
            pass: "N0i059.3.3*",
        },
    })
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log("Error enviando email")
            console.log(error.message)
        } else {
            console.log("Email enviado")
        }
    })
}
app.get('/api/get_usuario/:email', (req, res) => {
    const email = req.params.email;
    const sqlSelect = "select us.id ,upper(concat(nombre,' ',apellidos)) as Nombre,us.email,pr.id_modulo,mo.descripcion,nombre_estado from prod_adms.cnfg_usuarios us inner join prod_adms.cnfg_permisos pr on pr.email = us.email inner join prod_adms.cnfg_modulos mo on pr.id_modulo = mo.id_modulo left join prod_ctls.cat_estado edo on find_in_set(edo.id_estado, cnfg_edo) where us.email = ?; "  //PRODUCCION
    //const sqlSelect = "select id ,upper(concat(nombre,' ',apellidos)) as Nombre,email, curp from world.cnfg_usuarios where email = ?;"   //LOCALHOST
    db.query(sqlSelect, [email], (err, result) => {
        console.log(err);
        if (result == "") {
            res.send("[{\"email\": \"INEXISTENTE\"\}]");
        } else {
            res.send(result);
            console.log(result)
        }

    });
});
/**APIS MODIFICADAS**/


app.post('/api/post_registro', (req, res) => {
    const modulo = req.body.Modulo
    const nombre = req.body.Nombres
    const apellidos = req.body.Apellidos
    const email = req.body.Email
    const password = req.body.Password
    // string consulta
    const sqlInsert = "call prod_adms.upRegistro(?,?,?,?)"
    //     "values (?,?,?,SHA2(?,256),?,?,?,'99','R','CONAVI');";
    let a = db.query(sqlInsert, [
        nombre,
        apellidos,
        email,
        password],
        (err, result) => {
            //console.log("CONTAR DEL CORRREO", result[0])
            console.log(err)
            if (result[0] == undefined) {
                console.log("SUCCESS");
                if (modulo == 717) {
                    console.log()
                    Expediente(nombre, apellidos, email);
                }
                res.send("[{\"email\": \"VACIO\"\}]");
            } else {
                res.send("[{\"email\": \"ENCONTRADO\"\}]");
                console.log("WARNING");
            }

        });
});
app.get('/api/get_permisos/:email', (req, res) => {
    const email = req.params.email;
    const sqlSelect =
        "select distinct id,email AS Email,TRIM(SUBSTRING_INDEX(mdo.descripcion, '</i>', -1)) As Modulo, status AS Estatus, us.descripcion AS Descripcion,admin AS Administrador,edo.nombre_estado as Estado,cnfg_programa as TipoPrograma, concat('<i id=\"',id,'\"class=\"fas fa-search\"></i>') as hola_ FROM prod_adms.cnfg_permisos a left join prod_adms.cnfg_modulos mdo  on mdo.id_modulo = a.id_modulo left join  prod_adms.cnfg_tipo_usuario us on concat(us.id_modulo,us.acronimo) = binary concat(a.id_modulo,a.tipo) left join prod_ctls.cat_estado edo on find_in_set(edo.id_estado, a.cnfg_edo) where email=? order by id asc;";
    db.query(sqlSelect, [email], (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_idUsuario/:id', (req, res) => {
    const id = req.params.id;
    const sqlSelect =
        "select distinct id,email AS Email,TRIM(SUBSTRING_INDEX(mdo.descripcion, '</i>', -1)) As Modulo, status AS Estatus, us.descripcion AS Descripcion, admin AS Administrador,edo.nombre_estado as Estado,cnfg_programa as TipoPrograma FROM prod_adms.cnfg_permisos a left join prod_adms.cnfg_modulos mdo  on mdo.id_modulo = a.id_modulo left join  prod_adms.cnfg_tipo_usuario us on concat(us.id_modulo,us.acronimo) = binary concat(a.id_modulo,a.tipo) left join prod_ctls.cat_estado edo on find_in_set(edo.id_estado, a.cnfg_edo) where id= ? order by id asc;";
    db.query(sqlSelect, [id], (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/sesionTab_usr/:email/:psw', (req, res) => {
    const email = req.params.email;
    const psw = req.params.psw;
    const sqlSelect = "call prod_adms.sp_login(?, ?);"  //PRODUCCION
    //const sqlSelect = "select * FROM  world.cnfg_usuarios where email = ? and password = sha2(?,256);"  //LOCALHOST
    // ejecurtar consulta
    db.query(sqlSelect, [
        email, psw
    ], (err, result) => {
        console.log("RESULTADO", result);
        if (result[0].length !== 0) {
            res.send(result[0]);
            return true;
        }
        console.log("No Existe el registro");
        res.send("[{\"email\": \"INEXISTENTE\"\}]");

    });
});
































app.get('/api/get_beneficiariosTabla/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    //console.log("ESTO ES UN CONSOLE ", id_unico)
    const sqlSelect =

        "SELECT id_unico,CURPR, upper(concat(Nombre,' ',Primer_apellido,' ',Segundo_apellido)) as Nombres, case when Id_genero = '1' then 'Hombre' when id_genero ='2' then 'Mujer' end as Genero, concat(nombre_estado,', ',nombre_municipio,' ,',nombre_localidad) as Estado, concat(Calle,' ',NumInt,' ',NumExt,' ',Colonia) as Direccion, concat('<i id=\"',id_unico,'\"class=\"fas fa-info-circle\"></i>') as hola_ FROM prod_pev.pev_captura_c2_sr c1    inner join prod_ctls.cat_estado ce on ce.id_estado=c1.clave_estado inner join prod_ctls.cat_municipio mn on mn.id_estado=c1.clave_estado and mn.id_municipio = c1.clave_municipio inner join prod_ctls.cat_localidad lc on lc.id_estado=c1.clave_estado and lc.id_municipio = c1.clave_municipio and lc.id_localidad=c1.clave_localidad where id_unico = ?";
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err)
        //console.log("RESPUESTA DEL EMAIL", result)
        res.send(result);
    });
});
app.get('/api/get_beneficiarios', (req, res) => {
    const sqlSelect =

        "select ac.id_unico,CURPR,upper(concat(Nombre,' ',Primer_apellido,' ',Segundo_apellido)) as Nombres,concat(Calle,' ',NumInt,' ',NumExt,' ',Colonia) as Direccion,concat('<i id=\"',c2.id_unico ,'\"class=\"fas fa-info-circle\"></i>') as hola_ from prod_pev.pev_captura_c2_sr c2 inner join prod_pev.pev_acompanamiento ac on ac.id_unico = c2.id_unico inner join prod_ctls.cat_estado ce on ce.id_estado=c2.clave_estado inner join prod_ctls.cat_municipio mn on mn.id_estado=c2.clave_estado and mn.id_municipio = c2.clave_municipio;";


    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_acompanamientoDatos/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    //console.log("ESTO ES UN CONSOLE ", id_unico)
    const sqlSelect =

        "call prod_pev.Get_datosAcompanamiento(?);";
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log("PERRO RESULTADO A LA VERGA ME VALE VERGA CULERO: ", result[0])
        res.send(result[0]);
        console.log(err)


    });
});
app.get('/api/get_beneficiariosEntregas', (req, res) => {
    const sqlSelect =
        "SELECT ac.id_unico,c2.CURPR,upper(concat(Nombre,' ',Primer_apellido,' ',Segundo_apellido)) as Nombres,concat(nombre_estado,' ' ,nombre_municipio,' ' ,nombre_localidad) as Recidencia,concat('<i id=\"',c2.CURPR ,'\"class=\"fas fa-info-circle\"></i>') as hola_ from prod_pev.pev_captura_c2_sr c2 inner join prod_pev.pev_solventa ac on ac.curp = binary c2.CURPR inner join prod_ctls.cat_estado ce on ce.id_estado=c2.clave_estado inner join prod_ctls.cat_municipio mn on mn.id_estado=c2.clave_estado and mn.id_municipio = c2.clave_municipio inner join prod_ctls.cat_localidad lc on lc.id_estado=c2.clave_estado and lc.id_municipio = c2.clave_municipio and lc.id_localidad=c2.clave_localidad;";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_beneficiariosTablaEntregas/:curp', (req, res) => {
    const curp = req.params.curp;
    const sqlSelect =
        "call prod_pev.Get_datosEntrega(?)";
    db.query(sqlSelect, [curp], (err, result) => {
        console.log("PUTO PERRO RESULTADO A LA VERGAAAAAA", result[0])
        console.log(err)
        res.send(result[0]);
    });
});
app.get('/api/get_EntregaDatos/:curp', (req, res) => {
    const curp = req.params.curp;
    //console.log("ESTO ES UN CONSOLE ", id_unico)
    const sqlSelect =

        "SELECT id,curp,Pintura,Puertas,Impermeabilizacion,electrica,hidraulica,Ecotecnias,Fosa,Exteriores,Techo,Muros,Firme,Cuarto,Bano,Cocina,Estructurales,Terminacion,Cuenta_ayude_trabajos,imgEvidencia_carta,imgEvidencia_entrega FROM prod_pev.pev_solventa where curp = ?;";
    db.query(sqlSelect, [curp], (err, result) => {
        //console.log("resultado: ", result[0])
        res.send(result);
        console.log(err)


    });
});
//**CONSULTAS PEV_C3**/
app.get('/api/get_c3_tablaTermino', (req, res) => {
    const sqlSelect =

        "SELECT id_unico,curp,concat(nombre,' ',primer_apellido,' ',segundo_apellido) as Nombres,concat(nombre_estado,', ',nombre_municipio,' ,',nombre_localidad) as Estado,concat(calle,', ',colonia,', ',num_ext,', ',num_int,', ',cp) as Domicilio,telefono,tipo_apoyo,Programa, concat('<i id=\"',id_unico,'\"class=\"fas fa-info-circle\"></i>') as hola_ FROM  prod_pev.pev_c3_completo c2 inner join prod_pev.pev_captura_c3 ac on ac.folio = c2.id_unico inner join prod_ctls.cat_estado ce on ce.id_estado=c2.clave_estado inner join prod_ctls.cat_municipio mn on mn.id_estado=c2.clave_estado and mn.id_municipio = c2.clave_municipio inner join prod_ctls.cat_localidad lc on lc.id_estado=c2.clave_estado and lc.id_municipio = c2.clave_municipio and lc.id_localidad = c2.clave_localidad";


    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_c3_tablaBeneficiario/:folio', (req, res) => {
    const folio = req.params.folio;
    const sqlSelect =
        "SELECT id_unico,curp,concat(nombre,' ',primer_apellido,' ',segundo_apellido) as Nombres,concat(nombre_estado,', ',nombre_municipio,' ,',nombre_localidad) as Estado,concat(calle,', ',colonia,', ',num_ext,', ',num_int,', ',cp) as Domicilio,telefono,tipo_apoyo,Programa FROM  prod_pev.pev_c3_completo c2 inner join prod_pev.pev_captura_c3 ac on ac.folio = c2.id_unico inner join prod_ctls.cat_estado ce on ce.id_estado=c2.clave_estado inner join prod_ctls.cat_municipio mn on mn.id_estado=c2.clave_estado and mn.id_municipio = c2.clave_municipio inner join prod_ctls.cat_localidad lc on lc.id_estado=c2.clave_estado and lc.id_municipio = c2.clave_municipio and lc.id_localidad = c2.clave_localidad where ac.folio = ?";
    db.query(sqlSelect, [folio], (err, result) => {
        //console.log("resultado: ", result[0])
        res.send(result);
        console.log(err)


    });
});
app.get('/api/get_c3_tablaTerminoID/:folio', (req, res) => {
    const folio = req.params.folio;
    const sqlSelect = "call prod_pev.Get_c3_termino(?);";
    db.query(sqlSelect, [folio], (err, result) => {
        res.send(result[0]);
        console.log(err)


    });
});
/**TERMINAN CONSULTAS PEV_C3**/
////******////****////******/AQUI TERMINAN LAS CONSULTAS DE TABLERO DE USUARIOS/****////******////***
app.listen(3001, () => {
    console.log('corriendo en puerto 3001');
});






//**REPORTES PDF CARTAS */
function generateInfo(api, doc) {
    //console.log("Procedimiento para llenado del PDF", api);
    let pathImage = "../documents/pev_files_c2_sr/";
    // let fontpath = (__dirname + '/Montserrat-Regular.ttf');


    doc.image('C:/Administracion_usuarioss/servidor/IMAGENES/0UBE000624MCSZRLA6Evidencia_fotografica_curp_correcion_487713224663665395.jpg', 95, 230,
        { width: 70 }
    )
    // .text('IMAGEN CURP', 100, 210).fontSize(10).fillColor('');
    doc.font("Helvetica-Bold").fontSize(10).fillColor('#661e2c').text(`"INFORMACIÓN DE LA PERSONA SOLICITANTE"`, 35, 80, {
        width: 500,
        align: 'center'
    });
    doc.font("Helvetica-Bold").fontSize(10).fillColor('#661e2c').text(`"ID UNICO"\n` + api.id_unico, 50, 90, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos = 70;
    let colTop = 120;
    let colWidth = 120;
    let col2LeftPos = colWidth + col1LeftPos + 40;
    let col3LeftPos = colWidth + col2LeftPos + 40;
    //  let fontpath1 = (__dirname + '/Montserrat-Regular.ttf');
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text('CURP\n\n' + api.CURPR, col1LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('Nombre CURP\n\n' + api.Nombre + ' ' + api.Primer_apellido + ' ' + api.Segundo_apellido, col2LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('Fecha de nacimiento\n\n' + api.Fecha_nacimiento, col3LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    });
    let col1LeftPos1 = 70;
    let colTop1 = 165;
    let colWidth1 = 120;
    let col2LeftPos1 = colWidth1 + col1LeftPos1 + 40;
    let col3LeftPos1 = colWidth1 + col2LeftPos1 + 40;
    doc.fontSize(8).text('Genero \n\n' + api.Id_genero, col1LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    })

        .text('Nombre Ine\n\n' + api.Nombre_ine + ' ' + api.Primer_apellido_ine + ' ' + api.Segundo_apellido_ine + ' ', col3LeftPos1, colTop1, {
            width: colWidth1,
            align: 'center'
        });

    doc.image(path.join(pathImage, api.CURPR, api.Img_curp_correcion), 95, 230,
        { width: 70 }
    )
        .text('IMAGEN CURP', 100, 210).fontSize(10).fillColor('');

    doc.image(path.join(pathImage, api.CURPR, api.Img_ine_correcion), 250, 230,
        { width: 70 },
        { fontSize: 10 }
    )
        .text('INE', 270, 210);

    doc.image(path.join(pathImage, api.CURPR, api.Img_ine_correcion_b), 415, 230,
        { width: 70 }
    )
        .text('INE REVERSO', 420, 210).fontSize(5);

    let col1LeftPos2 = 70;
    let colTop2 = 340;
    let colWidth2 = 120;
    let col2LeftPos2 = colWidth2 + col1LeftPos2 + 40;
    let col3LeftPos2 = colWidth2 + col2LeftPos2 + 40;
    doc.fontSize(8).text('Estado \n\n' + api.Nombre_estado, col1LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('Municipio \n\n' + api.Nombre_municipio, col2LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('Direccion\n\n' + api.Direccion, col3LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    });
    let col1LeftPos3 = 70;
    let colTop3 = 390;
    let colWidth3 = 120;
    let col2LeftPos3 = colWidth3 + col1LeftPos3 + 40;
    let col3LeftPos3 = colWidth3 + col2LeftPos3 + 40;
    doc.fontSize(8).text('Código Postal \n\n' + api.Cp, col1LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    }).text('Referencia\n\n' + api.Referencia, col2LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    }).text('\n\n', col3LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    });


    doc.image(path.join(pathImage, api.CURPR, api.Img_Comprobante), 415, 410,
        { width: 80 }
    )
        .text('COMPROBANTE', 425, 400).fontSize(10).fillColor('#');

    let col1LeftPos31 = 70;
    let colTop31 = 450;
    let colWidth31 = 120;
    let col2LeftPos31 = colWidth31 + col1LeftPos31 + 40;
    let col3LeftPos31 = colWidth31 + col2LeftPos31 + 40;
    doc.fontSize(8).text('La persona solicitante, ¿cuenta con comprobante de la propiedad? \n\n' + api.C_cpropiedad, col1LeftPos31, colTop31, {
        width: colWidth31,
        align: 'center'
    }).text('\n\n', col2LeftPos31, colTop31, {
        width: colWidth31,
        align: 'center'
    }).text('\n\n', col3LeftPos31, colTop31, {
        width: colWidth3,
        align: 'center'
    });

    doc.image(path.join(pathImage, api.CURPR, api.Img_Propiedad_1), 85, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 1', 100, 540).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_Propiedad_2), 180, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 2', 220, 540).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_Propiedad_3), 320, 565,
        { width: 80 },
    )
        .text('PROPIEDAD 3', 330, 540).fontSize(8);


    doc.image(path.join(pathImage, api.CURPR, api.Img_Propiedad_4), 415, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 4', 430, 540).fontSize(8);


    doc.addPage();




    let col1LeftPos6 = 70;
    let colTop6 = 90;
    let colWidth6 = 120;
    let col2LeftPos6 = colWidth6 + col1LeftPos6 + 40;
    let col3LeftPos6 = colWidth6 + col2LeftPos6 + 40;
    doc.fillColor('#').fontSize(8).text('La persona beneficiaria, ¿Es el propietario de la vivienda? \n\n' + api.Beneficiario_propietario, col1LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    }).text('¿Cuenta con la autorización del propietario para la realización de los trabajos?\n\n' + api.Autorizacion_trabajos, col2LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    }).text('\n\n', col3LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    });
    doc.image(path.join(pathImage, api.CURPR, api.Img_Autorizacion_1),
        415, 105,
        { width: 80 }
    )
        .text('AUTORIZACION 1', 425, 95).fontSize(10).fillColor('');

    doc.image(path.join(pathImage, api.CURPR, api.Img_Autorizacion_2),
        { width: 80 }
    )
        .text('AUTORIZACION 2', 95, 230).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_Autorizacion_3),
        { width: 120 }
    )
        .text('AUTORIZACION 3', 220, 230).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_Autorizacion_4),
        { width: 80 },
    )
        .text('AUTORIZACION 4', 330, 230).fontSize(8);


    doc.image(path.join(pathImage, api.CURPR, api.Img_Autorizacion_5),
        { width: 80 }
    )
        .text('AUTORIZACION 5', 430, 230).fontSize(8);

    let col1LeftPos91 = 70;
    let colTop91 = 400;
    let colWidth91 = 120;
    let col2LeftPos91 = colWidth91 + col1LeftPos91 + 40;
    let col3LeftPos91 = colWidth91 + col2LeftPos91 + 40;
    doc.fontSize(8).text('¿La vivienda visitada es? \n\n' + api.Desc_vivienda, col1LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    }).text('Teléfono de contacto\n\n' + api.Telefono, col2LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    }).text('Teléfono alternativo \n\n' + api.Alternativo, col3LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    });
    doc.image(path.join(pathImage, api.CURPR, api.Img_Firma), 260, 550,
        { width: 80 },
    )
        .text('FIRMA', 290, 490).fontSize(8);


    doc.addPage()



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 35, 100, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones? \n\n  
    Ilegal: ` + api.Ilegal + ', ' + ' Autopista: ' + api.Autopista + ', ' + ' Tren: ' + api.Tren + ', ' + ' Torres: ' + api.Torres + ', ' +
        ' Ductos: ' + api.Ductos + ', ' + ' Derrumbes: '
        + api.Derrumbes + ', ' + ' Rios: ' + api.Rios + ', ' + ' Ninguno: ' + api.Ningun_s, 35, 115, {
        width: 500,
        align: 'center'
    });
    doc.image(path.join(pathImage, api.CURPR, api.Img_b2_1), 85, 255,
        { width: 80 }
    )
        .text('RIESGOS', 95, 230).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b2_2), 200, 255,
        { width: 80 }
    )
        .text('RIESGOS', 220, 230).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b2_3), 320, 255,
        { width: 80 },
    )
        .text('RIESGOS', 330, 230).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b2_4), 415, 255,
        { width: 80 }
    )
        .text('RIESGOS', 430, 230).fontSize(8);



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"RIESGOS INTERNOS PARA LA VIVIENDA"`, 60, 450, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?  \n\n Muros: ` + api.Gmuros + ' , ' + ' Pisos: ' + api.Gpisos + ' , ' + 'Techos: '
        + api.Dtecho + ' , '
        + ' Inclinaciones: '
        + api.Inclinacion + ' , '
        + ' Ninguna: '
        + api.Ningun_r, 60, 480, {
        width: 500,
        align: 'center'
    });


    doc.image(path.join(pathImage, api.CURPR, api.Img_b3_1), 85, 550,
        { width: 80 }
    )
        .text('INTERNOS ', 95, 520).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b3_2), 200, 550,
        { width: 80 }
    )
        .text('INTERNOS', 220, 520).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b3_3)
        , 320, 550,
        { width: 80 },
    )
        .text('INTERNOS ', 330, 520).fontSize(8);


    doc.image(path.join(pathImage, api.CURPR, api.Img_b3_4), 415, 550,
        { width: 80 }
    )
        .text('INTERNOS ', 430, 520).fontSize(8);


    doc.addPage()



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"DATOS SOCIOECONÓMICOS DE LOS HABITANTES DE LA VIVIENDA"`, 60, 90, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Las condiciones de la vivienda y de la zona corresponden a las características socioeconómicas de las personas a las que va dirigido el Programa?  \n\n`
        + api.Condiciones_vivienda, 35, 130, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`Aproximadamente ¿cuál es su ingreso total mensual? \n\n`
        + api.Ingreso_mensual_total, 35, 180, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra? \n\n `
        + api.Cuenta_ayude_trabajos, 35, 230, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuál es el número de habitantes de la vivienda?  \n\n`
        + api.Numero_habitantes, 35, 280, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda? \n\n `
        + api.Integrantes_contribuyen, 35, 330, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Habitan adultos mayores en la vivienda? \n\n `
        + api.N_mayores, 35, 380, {
        width: 500,
        align: 'justified'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas niñas habitan la vivienda? \n\n `
        + api.N_ninas, 37, 430, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas niños habitan en la vivienda? \n\n `
        + api.N_ninos, 37, 480, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan la vivienda son menores de edad jefes de familia? \n\n `
        + api.N_menores_jefes, 37, 530, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan la vivienda pertenecen a algún pueblo indígena?  \n\n`
        + api.N_indigenas, 37, 580, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan en la vivienda son madres solteras jefas de familia? \n\n`
        + api.N_solteras_jefas, 37, 630, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan en la vivienda tienen alguna discapacidad permanente?  \n\n`
        + api.N_discapacidad, 37, 680, {
        width: 500,
        align: 'justified'
    });

    doc.addPage();



    doc.image(path.join(pathImage, api.CURPR, api.Img_b4_1), 95, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS ', 95, 110).fillColor('black').fontSize(8);


    doc.image(path.join(pathImage, api.CURPR, api.Img_b4_2), 220, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS ', 220, 110).fillColor('black').fontSize(8);
    doc.image(path.join(pathImage, api.CURPR, api.Img_b4_3), 330, 120,
        { width: 80 },
    )
        .text('SOCIOECONÓMICOS  ', 330, 110).fillColor('#black').fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b4_4), 450, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS  ', 450, 110).fillColor('#black').fontSize(8);




    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"CARACTERÍSTICAS DE LA VIVIENDA"`, 60, 250, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos94 = 70;
    let colTop94 = 300;
    let colWidth94 = 120;
    let col2LeftPos94 = colWidth94 + col1LeftPos94 + 40;
    let col3LeftPos94 = colWidth94 + col2LeftPos94 + 40;
    doc.fillColor('#').fontSize(8).text('¿Cuántas recámaras tiene la vivienda? \n\n' + api.N_cuartos, col1LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    }).text('¿De qué material es el techo de la vivienda?  \n\n' + api.N_techo, col2LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    }).text('¿Con qué tipo de piso cuenta la vivienda?  \n\n' + api.N_piso, col3LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    });

    let col1LeftPos95 = 70;
    let colTop95 = 350;
    let colWidth95 = 120;
    let col2LeftPos95 = colWidth95 + col1LeftPos95 + 40;
    let col3LeftPos95 = colWidth95 + col2LeftPos95 + 40;
    doc.fillColor('#').fontSize(8).text('¿De qué material son los muros de la vivienda?  \n\n' + api.N_muros, col1LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    }).text(' \n\n', col2LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    }).text(' \n\n', col3LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    });


    doc.image(path.join(pathImage, api.CURPR, api.Img_b5_1), 85, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS  ', 95, 500).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b5_2), 210, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS ', 220, 500).fontSize(8);

    doc.image(path.join(pathImage, api.CURPR, api.Img_b5_3), 320, 520,
        { width: 80 },
    )
        .text('CARACTERÍSTICAS  ', 330, 500).fontSize(8);


    doc.image(path.join(pathImage, api.CURPR, api.Img_b5_4), 435, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS  ', 430, 500).fontSize(8);


}
// funcion para la creacion del documento
function GeneraPdf1(api, res) {
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=' + api[0].CURPR + '_' + api[0].Nombre + '_VISITA DE CONFIRMACIÓN DEL APOYO CUESTIONARIO 2.pdf'
    });
    generateInfo(api[0], doc);
    doc.pipe(res);
    doc.fontSize(12);
    //Global Edits to All Pages (Header/Footer, etc)
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < (range.start + range.count); i++) {

        doc.switchToPage(i);
        doc.lineWidth(7);
        doc.lineCap('round')
            .moveTo(50, 750)
            .lineTo(550, 750)
            .fillAndStroke("#b8925f")
            .stroke();
        doc.image("C:/Administracion_usuarioss/servidor/IMAGENES/magon.png", 50, 20, { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80, { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }

    doc.end();
}
// CREACION DE PDF
app.get('/api/get_pev2sr/:id_unico', (req, res) => {

    const id_unico = req.params.id_unico;
    const sqlSelect = "call prod_pev.sp_get_pevc2sr(?)";
    // ejecurtar consulta
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err);
        if (result == "") { } else { // res.send(result[0])
            GeneraPdf1(result[0], res);

        }
    });

})


/**PORTE REAL**/
function generateInfoCarta(api, doc) {
    console.log("Procedimiento para llenado del PDF", api);
    let pathImage = "../documents/pev_files_c2_sr/";
    doc.font("Helvetica-Bold").fontSize(10).fillColor('#661e2c').text(`"INFORMACIÓN DE LA PERSONA SOLICITANTE"`, 35, 80, {
        width: 500,
        align: 'center'
    });
    doc.font("Helvetica-Bold").fontSize(10).fillColor('#661e2c').text(`"ID UNICO"\n` + api.id_unico, 50, 90, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos = 70;
    let colTop = 120;
    let colWidth = 120;
    let col2LeftPos = colWidth + col1LeftPos + 40;
    let col3LeftPos = colWidth + col2LeftPos + 40;
    //  let fontpath1 = (__dirname + '/Montserrat-Regular.ttf');
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text('CURP\n\n' + api.CURPR, col1LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('Nombre CURP\n\n' + api.Nombre + ' ' + api.Primer_apellido + ' ' + api.Segundo_apellido, col2LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('Fecha de nacimiento\n\n' + api.Fecha_nacimiento, col3LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    });
    let col1LeftPos1 = 70;
    let colTop1 = 165;
    let colWidth1 = 120;
    let col2LeftPos1 = colWidth1 + col1LeftPos1 + 40;
    let col3LeftPos1 = colWidth1 + col2LeftPos1 + 40;
    doc.fontSize(8).text('Genero \n\n' + api.Id_genero, col1LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    })

        .text('Nombre Ine\n\n' + api.Nombre_ine + ' ' + api.Primer_apellido_ine + ' ' + api.Segundo_apellido_ine + ' ', col3LeftPos1, colTop1, {
            width: colWidth1,
            align: 'center'
        });

    doc.image(pathImage + api.CURPR + '/' + api.Img_curp_correcion, 95, 230,
        { width: 70 }
    )
        .text('IMAGEN CURP', 100, 210).fontSize(10).fillColor('');

    doc.image(pathImage + api.CURPR + '/' + api.Img_ine_correcion, 250, 230,
        { width: 70 },
        { fontSize: 10 }
    )
        .text('INE', 270, 210);

    doc.image(pathImage + api.CURPR + '/' + api.Img_ine_correcion_b, 415, 230,
        { width: 70 }
    )
        .text('INE REVERSO', 420, 210).fontSize(5);

    let col1LeftPos2 = 70;
    let colTop2 = 340;
    let colWidth2 = 120;
    let col2LeftPos2 = colWidth2 + col1LeftPos2 + 40;
    let col3LeftPos2 = colWidth2 + col2LeftPos2 + 40;
    doc.fontSize(8).text('Estado \n\n' + api.Nombre_estado, col1LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('Municipio \n\n' + api.Nombre_municipio, col2LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('Direccion\n\n' + api.Direccion, col3LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    });
    let col1LeftPos3 = 70;
    let colTop3 = 390;
    let colWidth3 = 120;
    let col2LeftPos3 = colWidth3 + col1LeftPos3 + 40;
    let col3LeftPos3 = colWidth3 + col2LeftPos3 + 40;
    doc.fontSize(8).text('Código Postal \n\n' + api.Cp, col1LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    }).text('Referencia\n\n' + api.Referencia, col2LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    }).text('\n\n', col3LeftPos3, colTop3, {
        width: colWidth3,
        align: 'center'
    });


    doc.image(pathImage + api.CURPR + '/' + api.Img_Comprobante, 415, 410,
        { width: 80 }
    )
        .text('COMPROBANTE', 425, 400).fontSize(10).fillColor('#');

    let col1LeftPos31 = 70;
    let colTop31 = 450;
    let colWidth31 = 120;
    let col2LeftPos31 = colWidth31 + col1LeftPos31 + 40;
    let col3LeftPos31 = colWidth31 + col2LeftPos31 + 40;
    doc.fontSize(8).text('La persona solicitante, ¿cuenta con comprobante de la propiedad? \n\n' + api.C_cpropiedad, col1LeftPos31, colTop31, {
        width: colWidth31,
        align: 'center'
    }).text('\n\n', col2LeftPos31, colTop31, {
        width: colWidth31,
        align: 'center'
    }).text('\n\n', col3LeftPos31, colTop31, {
        width: colWidth3,
        align: 'center'
    });

    doc.image(pathImage + api.CURPR + '/' + api.Img_Propiedad_1, 85, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 1', 100, 540).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_Propiedad_2, 180, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 2', 220, 540).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_Propiedad_3, 320, 565,
        { width: 80 },
    )
        .text('PROPIEDAD 3', 330, 540).fontSize(8);


    doc.image(pathImage + api.CURPR + '/' + api.Img_Propiedad_4, 415, 565,
        { width: 80 }
    )
        .text('PROPIEDAD 4', 430, 540).fontSize(8);


    doc.addPage();
    let col1LeftPos6 = 70;
    let colTop6 = 90;
    let colWidth6 = 120;
    let col2LeftPos6 = colWidth6 + col1LeftPos6 + 40;
    let col3LeftPos6 = colWidth6 + col2LeftPos6 + 40;
    doc.fillColor('#').fontSize(8).text('La persona beneficiaria, ¿Es el propietario de la vivienda? \n\n' + api.Beneficiario_propietario, col1LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    }).text('¿Cuenta con la autorización del propietario para la realización de los trabajos?\n\n' + api.Autorizacion_trabajos, col2LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    }).text('\n\n', col3LeftPos6, colTop6, {
        width: colWidth6,
        align: 'center'
    });
    doc.image(pathImage + api.CURPR + '/' + api.Img_Autorizacion_1,
        415, 105,
        { width: 80 }
    )
        .text('AUTORIZACION 1', 425, 95).fontSize(10).fillColor('');

    doc.image(pathImage + api.CURPR + '/' + api.Img_Autorizacion_2,
        { width: 80 }
    )
        .text('AUTORIZACION 2', 95, 230).fontSize(8);

    doc.image(pathImage + api.CURPR + '7' + api.Img_Autorizacion_3,
        { width: 120 }
    )
        .text('AUTORIZACION 3', 220, 230).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_Autorizacion_4,
        { width: 80 },
    )
        .text('AUTORIZACION 4', 330, 230).fontSize(8);


    doc.image(pathImage + api.CURPR + '/' + api.Img_Autorizacion_5,
        { width: 80 }
    )
        .text('AUTORIZACION 5', 430, 230).fontSize(8);

    let col1LeftPos91 = 70;
    let colTop91 = 400;
    let colWidth91 = 120;
    let col2LeftPos91 = colWidth91 + col1LeftPos91 + 40;
    let col3LeftPos91 = colWidth91 + col2LeftPos91 + 40;
    doc.fontSize(8).text('¿La vivienda visitada es? \n\n' + api.Desc_vivienda, col1LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    }).text('Teléfono de contacto\n\n' + api.Telefono, col2LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    }).text('Teléfono alternativo \n\n' + api.Alternativo, col3LeftPos91, colTop91, {
        width: colWidth91,
        align: 'center'
    });
    doc.image(pathImage + api.CURPR + '/' + api.Img_Firma, 260, 550,
        { width: 80 },
    )
        .text('FIRMA', 290, 490).fontSize(8);


    doc.addPage()



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 35, 100, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones? \n\n  
    Ilegal: ` + api.Ilegal + ', ' + ' Autopista: ' + api.Autopista + ', ' + ' Tren: ' + api.Tren + ', ' + ' Torres: ' + api.Torres + ', ' +
        ' Ductos: ' + api.Ductos + ', ' + ' Derrumbes: '
        + api.Derrumbes + ', ' + ' Rios: ' + api.Rios + ', ' + ' Ninguno: ' + api.Ningun_s, 35, 115, {
        width: 500,
        align: 'center'
    });
    doc.image(pathImage + api.CURPR + '/' + api.Img_b2_1, 85, 255,
        { width: 80 }
    )
        .text('RIESGOS', 95, 230).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b2_2, 200, 255,
        { width: 80 }
    )
        .text('RIESGOS', 220, 230).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b2_3, 320, 255,
        { width: 80 },
    )
        .text('RIESGOS', 330, 230).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b2_4, 415, 255,
        { width: 80 }
    )
        .text('RIESGOS', 430, 230).fontSize(8);



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"RIESGOS INTERNOS PARA LA VIVIENDA"`, 60, 450, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?  \n\n Muros: ` + api.Gmuros + ' , ' + ' Pisos: ' + api.Gpisos + ' , ' + 'Techos: '
        + api.Dtecho + ' , '
        + ' Inclinaciones: '
        + api.Inclinacion + ' , '
        + ' Ninguna: '
        + api.Ningun_r, 60, 480, {
        width: 500,
        align: 'center'
    });


    doc.image(pathImage + api.CURPR + '/' + api.Img_b3_1, 85, 550,
        { width: 80 }
    )
        .text('INTERNOS ', 95, 520).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b3_2, 200, 550,
        { width: 80 }
    )
        .text('INTERNOS', 220, 520).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b3_3
        , 320, 550,
        { width: 80 },
    )
        .text('INTERNOS ', 330, 520).fontSize(8);


    doc.image(pathImage + api.CURPR + '/' + api.Img_b3_4, 415, 550,
        { width: 80 }
    )
        .text('INTERNOS ', 430, 520).fontSize(8);


    doc.addPage()



    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"DATOS SOCIOECONÓMICOS DE LOS HABITANTES DE LA VIVIENDA"`, 60, 90, {
        width: 500,
        align: 'center'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Las condiciones de la vivienda y de la zona corresponden a las características socioeconómicas de las personas a las que va dirigido el Programa?  \n\n`
        + api.Condiciones_vivienda, 35, 130, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`Aproximadamente ¿cuál es su ingreso total mensual? \n\n`
        + api.Ingreso_mensual_total, 35, 180, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra? \n\n `
        + api.Cuenta_ayude_trabajos, 35, 230, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuál es el número de habitantes de la vivienda?  \n\n`
        + api.Numero_habitantes, 35, 280, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda? \n\n `
        + api.Integrantes_contribuyen, 35, 330, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Habitan adultos mayores en la vivienda? \n\n `
        + api.N_mayores, 35, 380, {
        width: 500,
        align: 'justified'
    });

    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas niñas habitan la vivienda? \n\n `
        + api.N_ninas, 37, 430, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas niños habitan en la vivienda? \n\n `
        + api.N_ninos, 37, 480, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan la vivienda son menores de edad jefes de familia? \n\n `
        + api.N_menores_jefes, 37, 530, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan la vivienda pertenecen a algún pueblo indígena?  \n\n`
        + api.N_indigenas, 37, 580, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan en la vivienda son madres solteras jefas de familia? \n\n`
        + api.N_solteras_jefas, 37, 630, {
        width: 500,
        align: 'justified'
    });
    doc.font("Helvetica-Bold").fontSize(8).fillColor('#').text(`¿Cuántas personas que habitan en la vivienda tienen alguna discapacidad permanente?  \n\n`
        + api.N_discapacidad, 37, 680, {
        width: 500,
        align: 'justified'
    });

    doc.addPage();



    doc.image(pathImage + api.CURPR + '/' + api.Img_b4_1, 95, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS ', 95, 110).fillColor('black').fontSize(8);


    doc.image(pathImage + api.CURPR + '/' + api.Img_b4_2, 220, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS ', 220, 110).fillColor('black').fontSize(8);
    doc.image(pathImage + api.CURPR + '/' + api.Img_b4_, 330, 120,
        { width: 80 },
    )
        .text('SOCIOECONÓMICOS  ', 330, 110).fillColor('#black').fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b4_4, 450, 120,
        { width: 80 }
    )
        .text('SOCIOECONÓMICOS  ', 450, 110).fillColor('#black').fontSize(8);




    doc.font("Helvetica-Bold").fontSize(9).fillColor('#661e2c').text(`"CARACTERÍSTICAS DE LA VIVIENDA"`, 60, 250, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos94 = 70;
    let colTop94 = 300;
    let colWidth94 = 120;
    let col2LeftPos94 = colWidth94 + col1LeftPos94 + 40;
    let col3LeftPos94 = colWidth94 + col2LeftPos94 + 40;
    doc.fillColor('#').fontSize(8).text('¿Cuántas recámaras tiene la vivienda? \n\n' + api.N_cuartos, col1LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    }).text('¿De qué material es el techo de la vivienda?  \n\n' + api.N_techo, col2LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    }).text('¿Con qué tipo de piso cuenta la vivienda?  \n\n' + api.N_piso, col3LeftPos94, colTop94, {
        width: colWidth94,
        align: 'center'
    });

    let col1LeftPos95 = 70;
    let colTop95 = 350;
    let colWidth95 = 120;
    let col2LeftPos95 = colWidth95 + col1LeftPos95 + 40;
    let col3LeftPos95 = colWidth95 + col2LeftPos95 + 40;
    doc.fillColor('#').fontSize(8).text('¿De qué material son los muros de la vivienda?  \n\n' + api.N_muros, col1LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    }).text(' \n\n', col2LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    }).text(' \n\n', col3LeftPos95, colTop95, {
        width: colWidth95,
        align: 'center'
    });


    doc.image(pathImage + api.CURPR + '/' + api.Img_b5_1, 85, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS  ', 95, 500).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b5_2, 210, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS ', 220, 500).fontSize(8);

    doc.image(pathImage + api.CURPR + '/' + api.Img_b5_3, 320, 520,
        { width: 80 },
    )
        .text('CARACTERÍSTICAS  ', 330, 500).fontSize(8);


    doc.image(pathImage + api.CURPR + '/' + api.Img_b5_4, 435, 520,
        { width: 80 }
    )
        .text('CARACTERÍSTICAS  ', 430, 500).fontSize(8);


}
// funcion para la creacion del documento
function GeneraCarta(api, res) {
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=' + api[0].CURPR + '_' + api[0].Nombre + '_VISITA DE CONFIRMACIÓN DEL APOYO CUESTIONARIO 2.pdf'
    });
    generateInfoCarta(api[0], doc);
    doc.pipe(res);
    doc.fontSize(12);
    //Global Edits to All Pages (Header/Footer, etc)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {

        doc.switchToPage(i);
        doc.lineWidth(7);
        doc.lineCap('round')
            .moveTo(50, 750)
            .lineTo(550, 750)
            .fillAndStroke("#b8925f")
            .stroke();
        doc.image("../headers/magon.png", 50, 20,
            { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
                { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }

    doc.end();
}
// CREACION DE PDF
app.get('/api/get_pev2sr/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect = "call prod_pev.sp_get_pevc2sr(?)";
    // ejecurtar consulta
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err);
        if (result == "") {

        } else { // res.send(result[0])
            GeneraCarta(result[0], res);

        }
    });

})
function toPostscriptPoint(mm) {
    return mm * 2.8346456693;
}


app.get('/api/get_cartaapoyo', (req, res) => {
    const sqlSelect = "SELECT * FROM prod_pev.pev_entrega_cartas_";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        console.log(result)
    });

})
// app.get('/api/get_PDFEntrega_apoyos/:id_unico', (req, res) => {
//     const id_unico = req.params.id_unico;
//     const sqlSelect = "call prod_pev.sp_getgenerapdf_Apoyos(?)";
//     // ejecurtar consulta
//     db.query(sqlSelect, [id_unico], (err, result) => {
//         console.log(err);
//         if (result == "") {

//         } else { // res.send(result[0])
//             Genera_PDFEntrega_apoyos_Cuerpo(result, res);

//         }
//     });

// })
// function Genera_PDFEntrega_apoyos_Cuerpo(api, res) {

//     // console.log("CONSOLE DE CURP",api[0].curp)
//     size: [toPostscriptPoint(156), toPostscriptPoint(106)]
//     const doc = new PDFDocument({ margin: 30, bufferPages: true });
//     res.writeHead(200, {

//         'Content-Type': 'application/pdf',
//         'Content-Disposition': 'attachment; filename=Entrega_Apoyos.pdf'
//     });
//     PDFEntrega_apoyos(api, doc);
//     doc.pipe(res);
//     doc.fontSize(12);
//     //Global Edits to All Pages (Header/Footer, etc)
//     const range = doc.bufferedPageRange();
//     for (let i = range.start; i < (range.start + range.count); i++) {
//         doc.switchToPage(i);
//         doc.lineWidth(7);
//         doc.lineCap('round')
//             .moveTo(50, 750)
//             .lineTo(550, 750)
//             .fillAndStroke("#b8925f")
//             .stroke();
//         // doc.image("../headers/magon.png", 50, 20,
//         //     { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
//         //         { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
//     }

//     doc.end();
// }
// function PDFEntrega_apoyos(api, doc) {
//     let pathImage = "../documents/pev_entrega/";

//     console.log(api[0].curp)
//     doc.font("Times-Bold").fontSize(25).fillColor('#661e2c').text(`ENTREGA APOYOS`, 35, 80, {
//         width: 500,
//         align: 'center'
//     });
//     doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 115, {
//         width: 500,
//         align: 'center'
//     });
//     // let col1LeftPos = 70;
//     // let colTop = 150;
//     // let colWidth = 120;
//     // let col2LeftPos = colWidth + col1LeftPos + 40;
//     // let col3LeftPos = colWidth + col2LeftPos + 40;
//     // doc.font("Times-Bold").fontSize(9).fillColor('#').text('CURP\n\n' + api[0].curp, col1LeftPos, colTop, {
//     //     width: colWidth,
//     //     align: 'center'
//     // }).text('NOMBRE (CURP)\n\n' + api[0].Nombre, col2LeftPos, colTop, {
//     //     width: colWidth,
//     //     align: 'center'
//     // }).text('PRIMER APELLIDO (CURP)\n\n' + api[0].Primer_apellido, col3LeftPos, colTop, {
//     //     width: colWidth,
//     //     align: 'center'
//     // });
//     // let col1LeftPos1 = 70;
//     // let colTop1 = 200;
//     // let colWidth1 = 120;
//     // let col2LeftPos1 = colWidth1 + col1LeftPos1 + 40;
//     // let col3LeftPos1 = colWidth1 + col2LeftPos1 + 40;
//     // doc.font("Times-Bold").fontSize(9).fillColor('#').text('SEGUNDO APELLIDO (CURP)\n\n' + api[0].Segundo_apellido, col1LeftPos1, colTop1, {
//     //     width: colWidth1,
//     //     align: 'center'
//     // }).text('NOMBRE (INE)\n\n' + api[0].Nombre_ine, col2LeftPos1, colTop1, {
//     //     width: colWidth1,
//     //     align: 'center'
//     // }).text('PRIMER APELLIDO (INE)\n\n' + api[0].Primer_apellido_ine, col3LeftPos1, colTop1, {
//     //     width: colWidth1,
//     //     align: 'center'
//     // });
//     // let col1LeftPos2 = 70;
//     // let colTop2 = 245;
//     // let colWidth2 = 120;
//     // doc.font("Times-Bold").fontSize(9).fillColor('#').text('SEGUNDO APELLIDO (INE)\n\n' + api[0].Segundo_apellido_ine, col1LeftPos2, colTop2, {
//     //     width: colWidth2,
//     //     align: 'center'
//     // });
//     // doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`FICHA DIAGNÓSTICA`, 35, 290, {
//     //     width: 500,
//     //     align: 'center'
//     // });
//     // doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿Qué linea de apoyo tiene la persona beneficiaria?`, 35, 330, {
//     //     width: 500,
//     //     align: 'center'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text(api[0].Tipo_apoyo_CONAVI, 35, 355, {
//     //     width: 500,
//     //     align: 'center'
//     // });
//     // doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text('¿En qué utilizaría su apoyo de Mejoramiento o Ampliación?', 35, 380, {
//     //     width: 500,
//     //     align: 'center'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('A) Pintura, Aplanados o colacioón de loseta en muros : ' + api[0].Pintura, 70, 420, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('B) Puertas y ventanas : ' + api[0].Puertas, 70, 430, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('C) Impermeabilización : ' + api[0].Impermeabilizacion, 70, 440, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('D) Instalacion Electrica : ' + api[0].electrica, 70, 450, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('E) Instalacion hidráulica y sanitaria : ' + api[0].hidraulica, 70, 460, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('F) Ecotecnias: Paneles solares, biodigestor, calentador solar, captacion de agua pluvial, etc : ' + api[0].Ecotecnias, 70, 470, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('G) Fosa séptica : ' + api[0].Fosa, 70, 480, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('h) Exteriores: bardas, firmes, techado, etc. : ' + api[0].Exteriores, 70, 490, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('I) Construcción de techo: ' + api[0].Techo, 70, 500, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('J) Construcción de muros: ' + api[0].Muros, 70, 510, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('K) Construcción firme y/o colacación de loseta: ' + api[0].Firme, 70, 520, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('L) Construcción de cuarto: ' + api[0].Cuarto, 70, 530, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('M) Construcción de baño: ' + api[0].Bano, 70, 540, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('N) Construcción de cocina: ' + api[0].Cocina, 70, 550, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('O) Construcción de elementos estructurales: cimentación, muros, columnas, trabes o techo: ' + api[0].Estructurales, 70, 560, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.font("Times-Bold").fontSize(10).fillColor('#').text('P) Terminación de la vivienda en obra negra: ' + api[0].Terminacion, 70, 570, {
//     //     width: 500,
//     //     align: 'left'
//     // });
//     // doc.save();
//     // doc.rotate(90, { origin: [0, 0] });
//     // try {
//     //     if (api[0].imgEvidencia_entrega != "") {
//     //         doc.image(pathImage + api[0].curp + '/' + api[0].imgEvidencia_entrega,
//     //             toPostscriptPoint(210),
//     //             toPostscriptPoint(-90),
//     //             { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
//     //     }
//     // } catch (e) { }
//     // try {
//     //     if (api[0].imgEvidencia_carta != "") {
//     //         doc.image(pathImage + api[0].curp + '/' + api[0].imgEvidencia_carta,
//     //             toPostscriptPoint(210),
//     //             toPostscriptPoint(-180),
//     //             { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
//     //     }
//     // } catch (e) { }
//     // doc.restore();
// }
//**ACOMPANAMIENTO**//
app.get('/api/get_acompa', (req, res) => {
    const sqlSelect = "select * from prod_pev.pev_acompanamiento_ ;";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        console.log(result)
    });

})
/**VISITA DE ACOMPAÑAMIENTO**/
function pdfAcompanamiento(api, doc) {
    // console.log("SITUACION OBRA", api[0].SituacionObra);
    let pathImage = "../documents/pev_files_acompanamiento/";

    doc.font("Times-Bold").fontSize(25).fillColor('#661e2c').text(`VISITA DE ACOMPAÑAMIENTO`, 35, 80, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 115, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos = 20;
    let colTop = 130;
    let colWidth = 150;
    let col2LeftPos = colWidth + col1LeftPos + 40;
    let col3LeftPos = colWidth + col2LeftPos + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('ID único\n\n' + api[0].id_unico, col1LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('CURP DEL BENEFICIARIO\n\n' + api[0].CURPR, col2LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('NOMBRE DEL BENEFICIARIO\n\n' + api[0].Nombres, col3LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    });
    let col1LeftPos1 = 45;
    let colTop1 = 180;
    let colWidth1 = 200;
    let col2LeftPos1 = colWidth1 + col1LeftPos1 + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('RESIDENCIA \n\n' + api[0].Estado, col1LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    }).text('DIRECCIÓN DEL BENEFICIARIO\n\n' + api[0].Direccion, col2LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    });
    let col1LeftPos2 = 45;
    let colTop2 = 225;
    let colWidth2 = 200;
    let col2LeftPos2 = colWidth2 + col1LeftPos2 + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('LATITUD \n\n' + api[0].latitud, col1LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('LONGITUD\n\n' + api[0].longitud, col2LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    });

    if (api[0].Aplicando == "SI") {
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria está aplicando el subsidio en el domicilio registrado?\n` + api[0].Aplicando, 55, 265, {
            width: 500,
            align: 'left'
        });
        // YA CONTIENE IMAGENES
        if (api[0].SituacionObra == 'OBRA CONCLUIDA') {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuál es la situación en la que se encuentran los trabajos de mejoramiento o ampliación de la vivienda?\n` + api[0].SituacionObra, 55, 300, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿Qué tipo de trabajos está realizando en su obra?\n`, 55, 340, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de una recámara, concina, baño o de algún otro tipo:  ` + api[0].CRecamara, 55, 355, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de losa de concreto, refuerzo estructural o barda de colindancia: ` + api[0].Closa, 55, 365, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Acabados cerámicos, repellos, yesos, pisos firmes, pintura, muebles de baño etc: ` + api[0].Acabados, 55, 375, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Instalación eléctrica, instalación sanitaria o instalación hidráulica:  ` + api[0].IElectrica, 55, 385, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Carpintería, herrería o cancelería:  ` + api[0].Carpinteria, 55, 395, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`De los siguientes componentes de una vivienda o espacio adecuado, selecciona con los que cuenta la construcción que lleva a cabo la persona beneficiaria:  `, 55, 415, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Piso firme:` + api[0].pisos, 55, 445, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Paredes: ` + api[0].paredes, 55, 455, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Techo: ` + api[0].techo, 55, 465, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Seguridad estructural (cuente con cimientos, castillos, cerramientos, etc.): ` + api[0].seg_estructural, 55, 475, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Iluminación y ventilación natural (ventanas): ` + api[0].iluminacion, 55, 485, {
                width: 500,
                align: 'left'
            });
            if (api[0].Aporto == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 500, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Cuanto mas aporto?: ` + api[0].DineroAporto, 55, 520, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 500, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].ParticipaObra == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 530, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona que participa en la realización de los trabajos de la obra percibe algún pago?: ` + api[0].PagoParticipa, 55, 560, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 530, {
                    width: 500,
                    align: 'left'
                });
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria tiene algún problema en la ejecución de su obra por falta de asesoría técnica?: ` + api[0].EjecucionTrabajos, 55, 570, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: ` + api[0].ControlGastos, 55, 585, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria? ` + api[0].AsambleaComun, 55, 595, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria? ` + api[0].UtilidadAsam, 55, 605, {
                width: 500,
                align: 'left'
            });
            //doc.addPage();
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra? ` + api[0].Taller_inicio, 55, 615, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada a su maestro de obra en el taller de inicio de obra? ` + api[0].Utilidad_taller, 55, 625, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio? ` + api[0].Compras_colectivas, 55, 635, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político? ` + api[0].Problema_gestion, 55, 660, {
                width: 500,
                align: 'left'
            });
            doc.addPage();
            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            //IMAGEN 1
            try {
                if (api[0].imgAcompanamiento_1 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_1,
                        toPostscriptPoint(40),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 2
            try {
                if (api[0].imgAcompanamiento_2 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_2,
                        toPostscriptPoint(40),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 3
            try {
                if (api[0].imgAcompanamiento_3 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_3,
                        toPostscriptPoint(100),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 4
            try {
                if (api[0].imgAcompanamiento_4 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_4,
                        toPostscriptPoint(100),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 5
            try {
                if (api[0].imgFirma != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgFirma,
                        toPostscriptPoint(170),
                        toPostscriptPoint(-135),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();



        }
        //YA CONTIENE IMAGENES CON RUTA PATH
        if (api[0].SituacionObra == 'OBRA EN PROCESO') {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuál es la situación en la que se encuentran los trabajos de mejoramiento o ampliación de la vivienda?\n` + api[0].SituacionObra, 55, 300, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Con qué avance cuenta la obra?\n` + api[0].AvanceObra, 55, 340, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuánto tiempo estima la persona beneficiaria para la conclusión de los trabajos de su obra?\n` + api[0].TiempoObra, 55, 380, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿Qué tipo de trabajos está realizando en su obra?\n`, 55, 410, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de una recámara, concina, baño o de algún otro tipo:  ` + api[0].CRecamara, 55, 420, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de losa de concreto, refuerzo estructural o barda de colindancia: ` + api[0].Closa, 55, 430, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Acabados cerámicos, repellos, yesos, pisos firmes, pintura, muebles de baño etc: ` + api[0].Acabados, 55, 440, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Instalación eléctrica, instalación sanitaria o instalación hidráulica:  ` + api[0].IElectrica, 55, 450, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Carpintería, herrería o cancelería:  ` + api[0].Carpinteria, 55, 460, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`De los siguientes componentes de una vivienda o espacio adecuado, selecciona con los que cuenta la construcción que lleva a cabo la persona beneficiaria:  `, 55, 485, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Piso firme:` + api[0].pisos, 55, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Paredes: ` + api[0].paredes, 55, 520, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Techo: ` + api[0].techo, 55, 530, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Seguridad estructural (cuente con cimientos, castillos, cerramientos, etc.): ` + api[0].seg_estructural, 55, 540, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Iluminación y ventilación natural (ventanas): ` + api[0].iluminacion, 55, 550, {
                width: 500,
                align: 'left'
            });
            if (api[0].Aporto == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 570, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Cuanto mas aporto?: ` + api[0].DineroAporto, 55, 585, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 580, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Con qué avance cuenta la obra?\n` + api[0].AvanceObra, 55, 340, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuánto tiempo estima la persona beneficiaria para la conclusión de los trabajos de su obra?\n` + api[0].TiempoObra, 55, 380, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].ParticipaObra == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 600, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona que participa en la realización de los trabajos de la obra percibe algún pago?: ` + api[0].PagoParticipa, 55, 625, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 615, {
                    width: 500,
                    align: 'left'
                }); //Utilidad_taller
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria tiene algún problema en la ejecución de su obra por falta de asesoría técnica?: ` + api[0].EjecucionTrabajos, 55, 645, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: ` + api[0].ControlGastos, 55, 660, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria? ` + api[0].AsambleaComun, 55, 680, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria? ` + api[0].UtilidadAsam, 55, 700, {
                width: 500,
                align: 'left'
            });
            doc.addPage();
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra? ` + api[0].Taller_inicio, 55, 90, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada a su maestro de obra en el taller de inicio de obra? ` + api[0].Utilidad_taller, 55, 120, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio? ` + api[0].Compras_colectivas, 55, 150, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político? ` + api[0].Problema_gestion, 55, 180, {
                width: 500,
                align: 'left'
            });
            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            //IMAGEN 1
            try {
                if (api[0].imgAcompanamiento_1 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_1,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 2
            try {
                if (api[0].imgAcompanamiento_2 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_2,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 3
            try {
                if (api[0].imgAcompanamiento_3 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_3,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 4
            try {
                if (api[0].imgAcompanamiento_4 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_4,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 5
            try {
                if (api[0].imgFirma != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgFirma,
                        toPostscriptPoint(210),
                        toPostscriptPoint(-135),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();
        }
        //YA CONTIENE IMAGENES CON RUTA PATH
        if (api[0].SituacionObra == 'OBRA NO INICIADA') {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuál es la situación en la que se encuentran los trabajos de mejoramiento o ampliación de la vivienda?\n` + api[0].SituacionObra, 55, 300, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Por qué razón la persona beneficiaria no ha iniciado con los trabajos de su obra o se encuentran suspendidos?\n` + api[0].RazonInicio, 55, 340, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`A pesar de no haber iniciado los trabajos de su obra o que estos se encuentren suspendidos, ¿la persona beneficiaria los pretende concluir?\n` + api[0].Concluir, 55, 375, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Qué tipo de trabajos está realizando en su obra?\n`, 55, 415, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de una recámara, concina, baño o de algún otro tipo:  ` + api[0].CRecamara, 55, 425, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de losa de concreto, refuerzo estructural o barda de colindancia: ` + api[0].Closa, 55, 435, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Acabados cerámicos, repellos, yesos, pisos firmes, pintura, muebles de baño etc: ` + api[0].Acabados, 55, 445, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Instalación eléctrica, instalación sanitaria o instalación hidráulica:  ` + api[0].IElectrica, 55, 455, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Carpintería, herrería o cancelería:  ` + api[0].Carpinteria, 55, 465, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`De los siguientes componentes de una vivienda o espacio adecuado, selecciona con los que cuenta la construcción que lleva a cabo la persona beneficiaria:  `, 55, 485, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Piso firme:` + api[0].pisos, 55, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Paredes: ` + api[0].paredes, 55, 520, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Techo: ` + api[0].techo, 55, 530, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Seguridad estructural (cuente con cimientos, castillos, cerramientos, etc.): ` + api[0].seg_estructural, 55, 540, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Iluminación y ventilación natural (ventanas): ` + api[0].iluminacion, 55, 550, {
                width: 500,
                align: 'left'
            });
            if (api[0].Aporto == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 580, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Cuanto mas aporto?: ` + api[0].DineroAporto, 55, 600, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: NO`, 55, 580, {
                    width: 500,
                    align: 'left'
                });
            }

            if (api[0].ParticipaObra == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 615, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona que participa en la realización de los trabajos de la obra percibe algún pago?: ` + api[0].PagoParticipa, 55, 625, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: NO`, 55, 615, {
                    width: 500,
                    align: 'left'
                }); //Utilidad_taller
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria tiene algún problema en la ejecución de su obra por falta de asesoría técnica?: ` + api[0].EjecucionTrabajos, 55, 645, {
                width: 500,
                align: 'left'
            });
            if (api[0].ControlGastos == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: NO`, 55, 660, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: ` + api[0].ControlGastos, 55, 660, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].AsambleaComun == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria?: NO`, 55, 680, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria? ` + api[0].AsambleaComun, 55, 680, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].UtilidadAsam == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria?: NO`, 55, 700, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria?: NO` + api[0].UtilidadAsam, 55, 700, {
                    width: 500,
                    align: 'left'
                });
            }


            doc.addPage();

            if (api[0].Taller_inicio == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra?: NO`, 55, 90, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra? ` + api[0].Taller_inicio, 55, 90, {
                    width: 500,
                    align: 'left'
                });
            }

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada a su maestro de obra en el taller de inicio de obra? ` + api[0].Utilidad_taller, 55, 120, {
                width: 500,
                align: 'left'
            });

            if (api[0].Compras_colectivas == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio?: NO`, 55, 150, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio? ` + api[0].Compras_colectivas, 55, 150, {
                    width: 500,
                    align: 'left'
                });
            }

            if (api[0].Problema_gestion == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político?: NO`, 55, 180, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político? ` + api[0].Problema_gestion, 55, 180, {
                    width: 500,
                    align: 'left'
                });
            }

            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            //IMAGEN 1
            try {
                if (api[0].imgAcompanamiento_1 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_1,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 2
            try {
                if (api[0].imgAcompanamiento_2 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_2,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 3
            try {
                if (api[0].imgAcompanamiento_3 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_3,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 4
            try {
                if (api[0].imgAcompanamiento_4 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_4,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 5
            try {
                if (api[0].imgFirma != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgFirma,
                        toPostscriptPoint(210),
                        toPostscriptPoint(-135),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();
        }
        if (api[0].SituacionObra == 'OBRA SUSPENDIDA') {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuál es la situación en la que se encuentran los trabajos de mejoramiento o ampliación de la vivienda?\n` + api[0].SituacionObra, 55, 300, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Por qué razón la persona beneficiaria no ha iniciado con los trabajos de su obra o se encuentran suspendidos?\n` + api[0].RazonInicio, 55, 340, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`A pesar de no haber iniciado los trabajos de su obra o que estos se encuentren suspendidos, ¿la persona beneficiaria los pretende concluir?\n` + api[0].Concluir, 55, 375, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Qué tipo de trabajos está realizando en su obra?\n`, 55, 415, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de una recámara, concina, baño o de algún otro tipo:  ` + api[0].CRecamara, 55, 425, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Construcción de losa de concreto, refuerzo estructural o barda de colindancia: ` + api[0].Closa, 55, 435, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Acabados cerámicos, repellos, yesos, pisos firmes, pintura, muebles de baño etc: ` + api[0].Acabados, 55, 445, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Instalación eléctrica, instalación sanitaria o instalación hidráulica:  ` + api[0].IElectrica, 55, 455, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Carpintería, herrería o cancelería:  ` + api[0].Carpinteria, 55, 465, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`De los siguientes componentes de una vivienda o espacio adecuado, selecciona con los que cuenta la construcción que lleva a cabo la persona beneficiaria:  `, 55, 485, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Piso firme:` + api[0].pisos, 55, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Paredes: ` + api[0].paredes, 55, 520, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Techo: ` + api[0].techo, 55, 530, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Seguridad estructural (cuente con cimientos, castillos, cerramientos, etc.): ` + api[0].seg_estructural, 55, 540, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`Iluminación y ventilación natural (ventanas): ` + api[0].iluminacion, 55, 550, {
                width: 500,
                align: 'left'
            });
            if (api[0].Aporto == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: ` + api[0].Aporto, 55, 580, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Cuanto mas aporto?: ` + api[0].DineroAporto, 55, 600, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del recurso otorgado mediante el apoyo, ¿el beneficiario aporta alguna otra cantidad adicional?: NO`, 55, 580, {
                    width: 500,
                    align: 'left'
                });
            }

            if (api[0].ParticipaObra == 'SI') {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: ` + api[0].ParticipaObra, 55, 615, {
                    width: 500,
                    align: 'left'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona que participa en la realización de los trabajos de la obra percibe algún pago?: ` + api[0].PagoParticipa, 55, 645, {
                    width: 500,
                    align: 'left'
                });
            }
            else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participa en la realización de los trabajos de la obra?: NO`, 55, 615, {
                    width: 500,
                    align: 'left'
                });
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria tiene algún problema en la ejecución de su obra por falta de asesoría técnica?: ` + api[0].EjecucionTrabajos, 55, 660, {
                width: 500,
                align: 'left'
            });
            if (api[0].ControlGastos == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: NO`, 55, 680, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria cuenta con su control de gastos de compra de materiales y pagos de mano de obra?: ` + api[0].ControlGastos, 55, 680, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].AsambleaComun == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria?: NO`, 55, 695, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria acudió a la asamblea comunitaria? ` + api[0].AsambleaComun, 55, 695, {
                    width: 500,
                    align: 'left'
                });
            }
            doc.addPage();

            if (api[0].UtilidadAsam == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria?: NO`, 55, 90, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada en la asamblea comunitaria?: ` + api[0].UtilidadAsam, 55, 90, {
                    width: 500,
                    align: 'left'
                });
            }
            if (api[0].Taller_inicio == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra?: NO`, 55, 115, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Quién realiza la ejecución de obra de la persona beneficiaria, ¿acudió al taller de inicio de obra? ` + api[0].Taller_inicio, 55, 115, {
                    width: 500,
                    align: 'left'
                });
            }

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Le fue de utilidad la información proporcionada a su maestro de obra en el taller de inicio de obra? ` + api[0].Utilidad_taller, 55, 130, {
                width: 500,
                align: 'left'
            });

            if (api[0].Compras_colectivas == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio?: NO`, 55, 155, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la compra de materiales, ¿se organizó con sus vecinos para llevar acabo las compras colectivas y así obtener un mejor precio? ` + api[0].Compras_colectivas, 55, 155, {
                    width: 500,
                    align: 'left'
                });
            }

            if (api[0].Problema_gestion == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político?: NO`, 55, 185, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Ha tenido o tiene algún problema en la ejecución de su obra por que le solicitan una parte del recurso como pago por alguna gestión o le presionan para que apoye a alguna persona, grupo o partido político? ` + api[0].Problema_gestion, 55, 185, {
                    width: 500,
                    align: 'left'
                });
            }


            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            //IMAGEN 1
            try {
                if (api[0].imgAcompanamiento_1 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_1,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 2
            try {
                if (api[0].imgAcompanamiento_2 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_2,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 3
            try {
                if (api[0].imgAcompanamiento_3 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_3,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 4
            try {
                if (api[0].imgAcompanamiento_4 != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgAcompanamiento_4,
                        toPostscriptPoint(85),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            //IMAGEN 5
            try {
                if (api[0].imgFirma != "") {
                    doc.image(pathImage + api[0].id_unico + '/' + api[0].imgFirma,
                        toPostscriptPoint(210),
                        toPostscriptPoint(-135),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();
        }
    }

}
// funcion para la creacion del documento
function Genera_PDFAcompanamiento(api, res) {
    console.log(api)
    size: [toPostscriptPoint(156), toPostscriptPoint(106)]
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {

        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename= api[0].id_unico.pdf'
    });
    pdfAcompanamiento(api[0], doc);
    doc.pipe(res);
    doc.fontSize(12);
    //Global Edits to All Pages (Header/Footer, etc)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);
        doc.lineWidth(7);
        doc.lineCap('round')
            .moveTo(50, 750)
            .lineTo(550, 750)
            .fillAndStroke("#b8925f")
            .stroke();
        // doc.image("../headers/magon.png", 50, 20,
        //     { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
        //         { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }

    doc.end();
}



// CREACION DE PDF
app.get('/api/get_acompanamiento/:id_unico/:st', (req, res) => {
    const id_unico = req.params.id_unico;

    const sqlSelect = "call prod_pev.sp_getacompanamiento_data(?);";
    // ejecurtar consulta
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err);
        console.log("resultado", result);
        if (result == "") {
            console.log("NO EXOSYTE REGISTRO FAVOR DE VERIFICAR")
        } else { // res.send(result[0])
            Genera_PDFAcompanamiento(result, res);

        }
    });

})
/**VISITA DE CONCLUSIÓN**/
app.get('/api/get_conclu', (req, res) => {
    const sqlSelect = "select * from world.pev_termino_entregas";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        console.log(result)
    });

});
function pdfConclusion(api, doc) {
    let pathImage = "../documents/pev_files_c3/";
    doc.font("Times-Bold").fontSize(25).fillColor('#661e2c').text(`PEV C3 CONCLUSIÓN`, 35, 80, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 115, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos = 50;
    let colTop = 130;
    let colWidth = 150;
    let col2LeftPos = colWidth + col1LeftPos + 40;
    let col3LeftPos = colWidth + col2LeftPos + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('BENEFICIARIO\n' + api[0][0].nombre + ' ' + api[0][0].primer_apellido + ' ' + api[0][0].segundo_apellido, col1LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('CURP DEL BENEFICIARIO\n' + api[0][0].curpr, col2LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('DOMICILIO\n' + api[0][0].nombre_estado + ' ' + api[0][0].nombre_municipio, col3LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    });
    let col1LeftPos2 = 45;
    let colTop2 = 185;
    let colWidth2 = 150;
    let col2LeftPos2 = colWidth2 + col1LeftPos2 + 40;
    let col3LeftPos2 = colWidth2 + col2LeftPos + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('LATITUD \n' + api[0][0].Latitud, col1LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    }).text('LONGITUD\n' + api[0][0].Longitud, col2LeftPos2, colTop2, {
        width: colWidth2,
        align: 'center'
    })
        .text('\n', col3LeftPos2, colTop2, {
            width: colWidth2,
            align: 'center'
        });

    doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Cuál es la situación en la que se encuentran los trabajos de ampliación o mejoramiento de la vivienda?\n` + api[0][0].situacion_trabajos, 55, 250, {
        width: 500,
        align: 'left'
    });
    // //YA CUENTA CON IMAGENES
    if (api[0][0].situacion_trabajos == "OBRA EN PROCESO") {
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`OBRA EN PROCESO`, 50, 270, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria tiene una obra en proceso?`, 50, 300, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_obra, 50, 313, {
            width: 500,
            align: 'left'
        });
        if (api[0][0].porque_proceso_obra == null) {

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿El apoyo se está aplicando en el domicilio registrado en el PEV?`, 50, 330, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_apoyo_aplico_domicilio, 50, 345, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria está participando en los trabajos de la obra sin pago?`, 50, 360, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_miembro_sin_pago, 50, 385, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la realización de los trabajos de obra, ¿a cuantas personas ha contratado la persona beneficiaria (albañiles y ayudantes, plomeros, trabajadores de herrería, etc.)`, 50, 395, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_personas_contradadas, 50, 420, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por la escasez de materiales?`, 50, 435, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_escasez_materiales, 50, 460, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de los materiales?`, 50, 470, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_costo_materiales, 50, 495, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por falta de mano de obra?`, 50, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_falta_manoobra, 50, 535, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de la mano de obra?`, 50, 545, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_costo_manoobra, 50, 570, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por problemas con permisos y tramites con el Municipio?`, 50, 585, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_permiso_municipio, 50, 615, {
                width: 500,
                align: 'left'
            });
            doc.addPage();
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Acta de hechos`, 50, 90, {
                width: 500,
                align: 'center'
            });
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Fotografias de la obra`, 50, 350, {
                width: 500,
                align: 'center'
            });

        } else {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Por qué razón la persona beneficiaria tiene aún su obra en proceso?`, 50, 325, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(9).fillColor('#').text(' ' + api[0][0].porque_proceso_obra, 50, 338, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿El apoyo se está aplicando en el domicilio registrado en el PEV?`, 50, 350, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_apoyo_aplico_domicilio, 50, 363, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria está participando en los trabajos de la obra sin pago?`, 50, 375, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_miembro_sin_pago, 50, 400, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la realización de los trabajos de obra, ¿a cuantas personas ha contratado la persona beneficiaria (albañiles y ayudantes, plomeros, trabajadores de herrería, etc.)`, 50, 415, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_personas_contradadas, 50, 440, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por la escasez de materiales?`, 50, 455, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_escasez_materiales, 50, 478, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de los materiales?`, 50, 490, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_costo_materiales, 50, 515, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por falta de mano de obra?`, 50, 530, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_falta_manoobra, 50, 550, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de la mano de obra?`, 50, 565, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_costo_manoobra, 50, 595, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por problemas con permisos y tramites con el Municipio?`, 50, 605, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].proceso_problema_permiso_municipio, 50, 630, {
                width: 500,
                align: 'left'
            });
            doc.addPage();
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Acta de hechos`, 50, 90, {
                width: 500,
                align: 'center'
            });
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Evidencia fotografica`, 50, 350, {
                width: 500,
                align: 'center'
            });
            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            try {
                if (api[0][0].imgb2_1 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb2_1,
                        toPostscriptPoint(60),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb2_2 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb2_2,
                        toPostscriptPoint(60),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb2_3 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb2_3,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb2_4 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb2_4,
                        toPostscriptPoint(150),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(40), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
        }
        doc.restore();

    }
    /*/*YA QUEDO CONTODOS LOS PODERES**/

    // // YA CUENTA CON IMAGENES
    if (api[0][0].situacion_trabajos == "OBRA CONCLUIDA") {
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`OBRA CONCLUIDA`, 50, 270, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿El apoyo se aplicó en el domicilio registrado en el PEV?`, 50, 300, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(`` + api[0][0].concluye_apoyo_aplico_domicilio, 50, 313, {
            width: 500,
            align: 'left'
        });

        if (api[0][0].concluye_apoyo_aplico_domicilio == 'NO') {

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En cuanto tiempo hizo su obra de mojaramiento o ampliación?`, 50, 325, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].tiempo_obra, 50, 340, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participo en los trabajos de la obra sin pago?`, 50, 360, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_miembro_sin_pago, 50, 375, {
                width: 500,
                align: 'left'
            });
            if (api[0][0].personas_contratadas == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ', 50, 415, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].personas_contratadas, 50, 415, {
                    width: 500,
                    align: 'left'
                });
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la realización de los trabajos de obra, ¿a cuantas personas contratado la persona beneficiaria(albañiles y ayudantes, plomeros, trabajadores de herrería, etc)`, 50, 390, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿utilizo los recursos de su apoyo para construir una recamara adicional?`, 50, 430, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_recamara, 50, 445, {
                width: 500,
                align: 'left'
            });


            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para construir una cocina?`, 50, 460, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_cocina, 50, 475, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para construir otros cuartos?`, 50, 495, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_cuartos, 50, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para sustituir o mejorar sus instalaciones (agua, drenaje, luz)?`, 50, 525, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_instalaciones, 50, 535, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para colocar,sustituir o mejorar sus puertas y/o ventanas?`, 50, 550, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_puertas_ventanas, 50, 570, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para colocar,sustituir o mejorar acabados (loseta, pintura, yeso, aplanados, impermeabilizante, etc) otros cuartos?`, 50, 590, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_acabados, 50, 615, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para trabajos no considerados en otras opciones: biodigestor, calentador solar, captaciónnde agua de lluvia, cisternas, fosas sépticas, tinacos, páneles solares, etc?`, 50, 630, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_otras_opciones, 50, 655, {
                width: 500,
                align: 'left'
            })

        } else {
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En cuanto tiempo hizo su obra de mojaramiento o ampliación?`, 50, 325, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].tiempo_obra, 50, 340, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria participo en los trabajos de la obra sin pago?`, 50, 360, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_miembro_sin_pago, 50, 375, {
                width: 500,
                align: 'left'
            });
            if (api[0][0].personas_contratadas == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ', 50, 415, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].personas_contratadas, 50, 415, {
                    width: 500,
                    align: 'left'
                });
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Para la realización de los trabajos de obra, ¿a cuantas personas contratado la persona beneficiaria(albañiles y ayudantes, plomeros, trabajadores de herrería, etc)`, 50, 390, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿utilizo los recursos de su apoyo para construir una recamara adicional?`, 50, 430, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_recamara, 50, 445, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para construir una cocina?`, 50, 460, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_cocina, 50, 475, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para construir otros cuartos?`, 50, 495, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_cuartos, 50, 510, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para sustituir o mejorar sus instalaciones (agua, drenaje, luz)?`, 50, 525, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_instalaciones, 50, 535, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para colocar,sustituir o mejorar sus puertas y/o ventanas?`, 50, 550, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_puertas_ventanas, 50, 570, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para colocar,sustituir o mejorar acabados (loseta, pintura, yeso, aplanados, impermeabilizante, etc) otros cuartos?`, 50, 590, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_acabados, 50, 615, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Utilizo los recursos de su apoyo para trabajos no considerados en otras opciones: biodigestor, calentador solar, captaciónnde agua de lluvia, cisternas, fosas sépticas, tinacos, páneles solares, etc?`, 50, 630, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].recursos_otras_opciones, 50, 655, {
                width: 500,
                align: 'left'
            })
        }
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Además del dinero otorgado mediante el apoyo,¿el beneficiario aportó alguna otra cantidad?`, 50, 675, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].beneficiario_aporto, 50, 690, {
            width: 500,
            align: 'left'
        })
        doc.addPage();
        if (api[0][0].beneficiario_aporto == "SI") {
            //  doc.addPage();
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('¿Qué cantidad aportó?', 50, 90, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].cantidad_aporto, 50, 110, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('¿En qué ocupó ese recurso?', 50, 135, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].ocupo_recurso, 50, 150, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por la escasez de materiales?', 50, 170, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_escasez_materiales, 50, 185, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por el incremento en el costo de los materiales?', 50, 200, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_costo_materiales, 50, 225, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por falta de mano de obra?', 50, 240, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_falta_manoobra, 50, 255, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por incremento en el costo de la mano de obra?', 50, 270, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_costo_manoobra, 50, 300, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por problemas con permisos y trámites con el municipio?', 50, 315, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_permiso_municipio, 50, 340, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por falta de asesoria tecnica?', 50, 355, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_asesoria_tecnica, 50, 370, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Hasta este momento, ¿la persona beneficiaria tuvo algun problema en la ejecución de su obra por que le solicitaron una parte de su recurso como pago por alguna gestión o le han presionado para que apoye a alguna persona, grupo o partido político?', 50, 385, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_pago_gestion, 50, 425, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('En una calificacion del 1 al 10 ,¿Que tanto le ayudó el programa a mejorar las condiciones de su vivienda? (Donde 1 es el mas bajo y el 10 es el más alto)', 50, 435, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].ayudo_programa, 50, 458, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('En una escala del 1 al 10 ,¿cómo calificaria el Programa?(Donde 1 es el más bajo y 10 es el más alto)', 50, 475, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].califica_programa, 50, 490, {
                width: 500,
                align: 'left'
            })
            doc.addPage();
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Constancia de conclusión de los trabajos', 50, 110, {
                width: 500,
                align: 'center'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Fotografías de la obra', 50, 400, {
                width: 500,
                align: 'center'
            })



            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            try {
                if (api[0][0].imgb5_1 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_1,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(50),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });

                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_2 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_2,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(50),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                    console.log()

                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_3 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_3,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(165),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_4 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_4,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(165),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();

        } else {
            if (api[0][0].ocupo_recurso == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('', 50, 110, {
                    width: 500,
                    align: 'left'
                })
                doc.font("Times-Bold").fontSize(10).fillColor('#').text('', 50, 120, {
                    width: 500,
                    align: 'left'
                })
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('¿En qué ocupó ese recurso?', 50, 110, {
                    width: 500,
                    align: 'left'
                })
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].ocupo_recurso, 50, 120, {
                    width: 500,
                    align: 'left'
                })
            }
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por la escasez de materiales?', 50, 105, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_escasez_materiales, 50, 118, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por el incremento en el costo de los materiales?', 50, 130, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_costo_materiales, 50, 153, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por falta de mano de obra?', 50, 170, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_falta_manoobra, 50, 185, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por incremento en el costo de la mano de obra?', 50, 200, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_costo_manoobra, 50, 230, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por problemas con permisos y trámites con el municipio?', 50, 250, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_permiso_municipio, 50, 275, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('La persona beneficiaria tuvo algun problema en la ejecución de su obra por falta de asesoria tecnica?', 50, 290, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_asesoria_tecnica, 50, 305, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Hasta este momento, ¿la persona beneficiaria tuvo algun problema en la ejecución de su obra por que le solicitaron una parte de su recurso como pago por alguna gestión o le han presionado para que apoye a alguna persona, grupo o partido político?', 50, 330, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].concluye_problema_pago_gestion, 50, 370, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('En una calificacion del 1 al 10 ,¿Que tanto le ayudó el programa a mejorar las condiciones de su vivienda? (Donde 1 es el mas bajo y el 10 es el más alto)', 50, 390, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].ayudo_programa, 50, 415, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('En una escala del 1 al 10 ,¿cómo calificaria el Programa?(Donde 1 es el más bajo y 10 es el más alto)', 50, 430, {
                width: 500,
                align: 'left'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].califica_programa, 50, 445, {
                width: 500,
                align: 'left'
            })
            doc.addPage();
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Constancia de conclusión de los trabajos', 50, 110, {
                width: 500,
                align: 'center'
            })
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text('Fotografías de la obra', 50, 400, {
                width: 500,
                align: 'center'
            })
            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            try {
                if (api[0][0].imgb5_1 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_1,
                        //doc.image('C:/Administrascion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',                                           
                        toPostscriptPoint(50),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });

                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_2 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_2,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',                                                                
                        toPostscriptPoint(50),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_3 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_3,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',                                           
                        toPostscriptPoint(165),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb5_4 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb5_4,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',                                           
                        toPostscriptPoint(165),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                    console.log("VALII VERGA", pathImage + api[0][0].folio + '/' + api[0][0].imgb5_4)
                }
            } catch (e) { }
            doc.restore();

        }

    }
    /*/*YA QUEDO CONTODOS LOS PODERES**/

    // // YA CUENTA CON IMAGENES
    if (api[0][0].situacion_trabajos == "OBRA NO INICIADA") {
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`OBRA NO INICIADA`, 50, 270, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria no ha iniciado la obra?`, 50, 300, {
            width: 500,
            align: 'left'
        });
        if (api[0][0].no_inicio_obra == 'NO') {
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`` + api[0][0].no_inicio_obra, 50, 315, {
                width: 500,
                align: 'left'
            });

            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Acta de hechos`, 50, 330, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Fotografías de la obra`, 50, 550, {
                width: 500,
                align: 'left'
            });
            doc.save();
            doc.rotate(90, { origin: [0, 0] });
            try {
                if (api[0][0].imgb4_1 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_1,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(125),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb4_2 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_2,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(125),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb4_3 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_3,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(200),
                        toPostscriptPoint(-90),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            try {
                if (api[0][0].imgb4_4 != "") {
                    doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_4,
                        //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                        toPostscriptPoint(200),
                        toPostscriptPoint(-180),
                        { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                }
            } catch (e) { }
            doc.restore();
        } else {
            doc.font("Times-Bold").fontSize(10).fillColor('#').text(`` + api[0][0].proceso_obra, 50, 315, {
                width: 500,
                align: 'left'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Por qué razón la persona beneficiaria no inicio la obra?`, 50, 330, {
                width: 500,
                align: 'left'
            });
            if (api[0][0].porque_no_inicio_obra == null) {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(`NO`, 50, 345, {
                    width: 500,
                    align: 'left'
                });
            } else {
                doc.font("Times-Bold").fontSize(10).fillColor('#').text(`` + api[0][0].porque_no_inicio_obra, 50, 345, {
                    width: 500,
                    align: 'left'
                });
                if (api[0].porque_no_inicio_obra == 'HA FALLECIDO') {
                    doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Acta de defunción`, 50, 370, {
                        width: 500,
                        align: 'left'
                    });

                    doc.save();
                    doc.rotate(90, { origin: [0, 0] });
                    try {
                        if (api[0][0].imgActaDefuncionB4 != "") {
                            doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgActaDefuncionB4,
                                ///doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                                toPostscriptPoint(135),
                                toPostscriptPoint(-90),
                                { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                        }
                    } catch (e) { }
                    doc.restore();
                } else {
                    doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Acta de hechos`, 50, 400, {
                        width: 500,
                        align: 'left'
                    });
                    doc.save();
                    doc.rotate(90, { origin: [0, 0] });
                    try {
                        if (api[0][0].imgb4_1 != "") {
                            doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_1,
                                //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                                toPostscriptPoint(210),
                                toPostscriptPoint(-90),
                                { width: toPostscriptPoint(50), height: toPostscriptPoint(50) });
                        }
                    } catch (e) { }
                    try {
                        if (api[0][0].imgb4_2 != "") {
                            doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_2,
                                //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                                toPostscriptPoint(210),
                                toPostscriptPoint(-180),
                                { width: toPostscriptPoint(50), height: toPostscriptPoint(50) });
                        }
                    } catch (e) { }
                    doc.restore();
                    doc.addPage();
                    doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Fotografías de la obra`, 50, 90, {
                        width: 500,
                        align: 'left'
                    });
                    doc.save();
                    doc.rotate(90, { origin: [0, 0] });
                    try {
                        if (api[0][0].imgb4_3 != "") {
                            doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_3,
                                //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                                toPostscriptPoint(50),
                                toPostscriptPoint(-90),
                                { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                        }
                    } catch (e) { }
                    try {
                        if (api[0][0].imgb4_4 != "") {
                            doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb4_4,
                                //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                                toPostscriptPoint(50),
                                toPostscriptPoint(-180),
                                { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
                        }
                    } catch (e) { }
                    doc.restore();
                }

            }
        }
    }
    /*/*YA QUEDO CONTODOS LOS PODERES**/

    // // YA CUENTA CON IMAGENES
    if (api[0][0].situacion_trabajos == "OBRA SUSPENDIDA") {
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`OBRA SUSPENDIDA`, 50, 270, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria suspendio la obra?`, 50, 300, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspendio_obra, 50, 310, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Por qué razón la persona beneficiaria tiene suspendio la obra?`, 50, 325, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(9).fillColor('#').text(' ' + api[0][0].porque_suspendio_obra, 50, 335, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿El apoyo se está aplicando en el domicilio registrado en el PEV?`, 50, 355, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_apoyo_aplico_domicilio, 50, 370, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿La persona beneficiaria o algún miembro de la familia beneficiaria está participando en los trabajos de la obra sin pago? Para la realización de los trabajos de obra, ¿a cuantas personas ha contratado la persona beneficiaria (albañiles y ayudantes, plomeros, trabajadores de herrería, etc.)`, 50, 390, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_miembro_sin_pago, 50, 425, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por la escasez de materiales?`, 50, 438, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_escasez_materiales, 50, 462, {
            width: 500,
            align: 'left'
        });


        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de los materiales?`, 50, 478, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_costo_materiales, 50, 505, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por falta de mano de obra?`, 50, 520, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_falta_manoobra, 50, 545, {
            width: 500,
            align: 'left'
        });

        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por el incremento en el costo de la mano de obra?`, 50, 560, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_costo_manoobra, 50, 585, {
            width: 500,
            align: 'left'
        });


        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por problemas con permisos y tramites con el Municipio?`, 50, 600, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_permiso_municipio, 50, 625, {
            width: 500,
            align: 'left'
        });


        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por falta de asesoria tecnica?`, 50, 640, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_asesoria_tecnica, 50, 665, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`Hasta este momento, ¿la persona beneficiaria ha tenido problemas en la ejecución de su obra por que le solicitaron una parte de su recurso como pago por alguna gestión o le han presionado para que apoye a alguna persona, grupo o partido político?`, 50, 680, {
            width: 500,
            align: 'left'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#').text(' ' + api[0][0].suspende_problema_pago_gestion, 50, 720, {
            width: 500,
            align: 'left'
        });

        doc.addPage();

        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Acta de hechos`, 50, 90, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`Fotografias de la obra`, 50, 350, {
            width: 500,
            align: 'center'
        });
        doc.save();
        doc.rotate(90, { origin: [0, 0] });
        try {
            if (api[0][0].imgb3_1 != "") {
                doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb3_1,
                    //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                    toPostscriptPoint(50),
                    toPostscriptPoint(-90),
                    { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
            }
        } catch (e) { }
        try {
            if (api[0][0].imgb3_2 != "") {
                doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb3_2,
                    //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                    toPostscriptPoint(50),
                    toPostscriptPoint(-180),
                    { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
            }
        } catch (e) { }
        try {
            if (api[0][0].imgb3_3 != "") {
                doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb3_3,
                    //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                    toPostscriptPoint(155),
                    toPostscriptPoint(-90),
                    { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
            }
        } catch (e) { }
        try {
            if (api[0][0].imgb3_4 != "") {
                doc.image(pathImage + api[0][0].folio + '/' + api[0][0].imgb3_4,
                    //doc.image('C:/Administracion_usuarioss/servidor/apoyos/AAAA360713HTCLLN00solv_imgEvidencia_cartaENTREGA_3790634360565245398.jpg',
                    toPostscriptPoint(155),
                    toPostscriptPoint(-180),
                    { width: toPostscriptPoint(60), height: toPostscriptPoint(50) });
            }
        } catch (e) { }
        doc.restore();
    }
    /*/*YA QUEDO CONTODOS LOS PODERES**/
}
// funcion para la creacion del documentos
function Genera_PDFConclusion(api, res) {
    size: [toPostscriptPoint(156), toPostscriptPoint(106)]
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {

        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=' + api[0][0].situacion_trabajos + '_' + api[0][0].folio + '.pdf'
    });
    pdfConclusion(api, doc);
    doc.pipe(res);
    doc.fontSize(12);
    //Global Edits to All Pages (Header/Footer, etc)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);
        doc.lineWidth(7);
        doc.lineCap('round')
            .moveTo(50, 750)
            .lineTo(550, 750)
            .fillAndStroke("#b8925f")
            .stroke();
        // doc.image("../headers/magon.png", 50, 20,
        //     { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
        //         { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }

    doc.end();
}
// CREACION DE PDF
app.get('/api/get_terminopdf/:folio', (req, res) => {
    const folio = req.params.folio;
    const sqlSelect = "call prod_pev.sp_get_c3_individual(?);";
    // ejecurtar consulta
    db.query(sqlSelect, [folio], (err, result) => {
        console.log(err);
        console.log("resultado", result);
        if (result == "") {
            console.log("NO EXOSYTE REGISTRO FAVOR DE VERIFICAR")
        } else { // res.send(result[0])
            Genera_PDFConclusion(result, res);

        }
    });

})



//**EXPEDIENTE UNICO DIGITAL* */


app.get('/api/exundi_reporte_checks/:folio/', (req, res) => {
    const folio = req.params.folio;
    const sqlSelect = "call prod_pnv.sp_get_caratula_exp(?);"  //PRODUCCION
    db.query(sqlSelect, [
        folio
    ], (err, result) => {

        if (result == "") {


        } else {// res.send(result[0])
            //console.log("RESULTADI AKV", result)
            Genera_PDFAcompanamientoa(result, res);

        }
    });
});
function pdfAcompanamientoa(api, doc) {
    doc.rect(50, 50, 500, 50).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc
        .fillColor("#444444")
        .fontSize(8)
        .text("SUBDIRECCIÓN GENERAL DE ADMINISTRACIÓN Y FINANCIAMIENTO", 255, 55, { align: "center" })
        .fontSize(8)
        .text("COORDINACIÓN GENERAL DE ADMINISTRACIÓN ", 330, 65, { align: "center" })
        .text("DIRECCIÓN DE ADMINISTRACIÓN DE RECURSOS", 325, 75, { align: "center" })
        .text("DEPARTAMENTO DE UNIDADES DEPARTAMENTALES", 315, 85, { align: "center" })
        .moveDown();
    doc.rect(50, 95, 500, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Cáratula de descripción del expediente", 235, 100, { lineBreak: true });

    doc.rect(50, 110, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Nombre de la Unidad adminstrativa  \n productora de la documentación", 52, 113, { lineBreak: true }, { columnGap: 15 });

    doc.rect(185, 110, 365, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Subdirección General de Operación y Seguimiento", 295, 118, { lineBreak: true });

    doc.rect(50, 135, 500, 15).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Datos de la Clave de clasificación por asunto", 235, 140, { lineBreak: true });

    doc.rect(50, 150, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fondo:", 52, 158, { lineBreak: true }, { columnGap: 15 });
    doc.rect(185, 150, 365, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("CONAVI", 335, 158, { lineBreak: true });

    doc.rect(50, 175, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Sección, serie y subserie \n documental:", 51.5, 180, { lineBreak: true }, { columnGap: 15 });

    doc.rect(185, 175, 365, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("2s.5", 345, 185, { lineBreak: true });



    doc.rect(50, 200, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Clave de clasificación completa:", 52, 205, { lineBreak: true }, { columnGap: 15 });
    doc.rect(185, 200, 365, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("s.5-1093 - 2019 / 2019", 305, 205, { lineBreak: true });

    doc.rect(50, 220, 500, 15).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Datos del expediente", 275, 225, { lineBreak: true }, { font: 'Courier-Bold' });


    doc.rect(50, 235, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Titulo del expediente", 52, 245, { lineBreak: true }, { columnGap: 15 });

    doc.rect(185, 235, 365, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(' ' + api[0][0].curp + '  /  ' + api[0][0].nombre_, 240, 245, { lineBreak: true });


    doc.rect(50, 260, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fecha del primer documento del\n expediente", 52, 265, { lineBreak: true }, { columnGap: 15 });

    doc.rect(185, 260, 130, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("11 - julio 2023", 220, 270, { lineBreak: true });

    doc.rect(315, 260, 120, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fecha del último documento\n del expediente", 320, 265, { lineBreak: true });
    doc.rect(430, 260, 120, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("23 - julio - 2023", 465, 270, { lineBreak: true });


    doc.rect(50, 285, 135, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Número de fojas por expediente o\n legajo", 51, 290, { lineBreak: true }, { columnGap: 15 });
    doc.rect(185, 285, 130, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("250", 235, 295, { lineBreak: true });


    doc.rect(315, 285, 115, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Número de legajo", 335, 295, { lineBreak: true });
    doc.rect(430, 285, 120, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("277", 480, 295, { lineBreak: true });



    doc.rect(50, 310, 135, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Cantidad de documentos en", 55, 325, { lineBreak: true }, { columnGap: 15 });

    doc.rect(185, 310, 75, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Originales", 200, 315, { lineBreak: true }, { columnGap: 15 });

    doc.rect(255, 310, 60, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Copias:", 270, 315, { lineBreak: true }, { columnGap: 15 });


    doc.rect(185, 330, 75, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("12", 215, 337, { lineBreak: true }, { columnGap: 15 });

    doc.rect(255, 330, 60, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("15", 275, 337, { lineBreak: true }, { columnGap: 15 });


    doc.rect(315, 310, 115, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Cantidad de Cd´s:", 335, 325, { lineBreak: true }, { columnGap: 15 });

    doc.rect(430, 310, 120, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("  ", 430, 385, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 350, 205, 40).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(7);
    doc.text("Valores de la serie que indica que el Catálogo de disposición\n documental (A=administrativo; L=legal F=fiscal y C=contable).", 52, 360, { lineBreak: true }, { columnGap: 15 });


    doc.rect(255, 350, 175, 40).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(7);
    doc.text("Número de años de conservación en los diferentes\n tipos de archivos que se indica en el Cátalogo de\n disposición documental (AT=archivo trámite y\n AC=archivo concentración).", 256, 355, { lineBreak: true }, { columnGap: 15 });

    doc.rect(430, 350, 120, 40).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Técnicas de selección de la documentación (E=eliminación; \nC=conservación)", 432, 355, { lineBreak: true }, { columnGap: 15 });



    doc.rect(50, 390, 68.3, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Administrativo", 54, 400, { lineBreak: true }, { columnGap: 15 });

    doc.rect(115, 390, 68.3, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Legal", 135, 400, { lineBreak: true }, { columnGap: 15 });

    doc.rect(180, 390, 75, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contable/Fiscal", 185, 400, { lineBreak: true }, { columnGap: 15 });

    doc.rect(50, 410, 68.3, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 80, 418, { lineBreak: true }, { columnGap: 15 });

    doc.rect(115, 410, 68.3, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 140, 418, { lineBreak: true }, { columnGap: 15 });

    doc.rect(180, 410, 75, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 215, 418, { lineBreak: true }, { columnGap: 15 });

    doc.rect(255, 390, 58, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Tramite", 270, 400, { lineBreak: true }, { columnGap: 15 });
    doc.rect(255, 410, 58, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 280, 418, { lineBreak: true }, { columnGap: 15 });

    doc.rect(310, 390, 120, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Concentración", 345, 400, { lineBreak: true }, { columnGap: 15 });
    doc.rect(310, 410, 120, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 365, 418, { lineBreak: true }, { columnGap: 15 });


    doc.rect(430, 390, 120, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    //doc.text("Concentración", 345, 400, { lineBreak: true }, { columnGap: 15 });
    doc.rect(430, 410, 120, 20).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    //doc.text("X", 365, 418, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 430, 500, 15).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Cáracter de la información", 260, 433, { lineBreak: true }, { font: 'Courier-Bold' });

    doc.rect(50, 445, 130, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Pública", 100, 450, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 460, 130, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });


    doc.rect(180, 445, 75, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Confidencial", 195, 450, { lineBreak: true }, { columnGap: 15 });
    doc.rect(180, 460, 75, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 215, 465, { lineBreak: true }, { columnGap: 15 });

    doc.rect(250, 445, 300, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Reservada cuando surja de una solicitud de información", 290, 450, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 460, 300, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("######", 380, 465, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 475, 500, 15).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Descripción del asunto o asuntos contenidos en el expediente", 200, 480, { lineBreak: true }, { font: 'Courier-Bold' });

    doc.rect(50, 490, 500, 90).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    /**Documentos**/
    doc.text("Comite: " + api[0][0].comite + ", Programa: " + api[0][0].programa + ", Estado y Municipio: " + api[0][0].nombre_estado + " " + api[0][0].nombre_municipio
        + ", Clave CONAVI:" + api[0][0].folio + "\nCONTIENE  INE:" + (api[0][0].ine).toUpperCase() + ", CURP: " + (api[0][0].curp_r).toUpperCase() + ", Acta de Nacimiento: "
        + (api[0][0].acta_nacimiento).toUpperCase() + ", Comprobante de domicilio: " + (api[0][0].comp_domicilio).toUpperCase() + ", Titulo de propiedad:" + (api[0][0].doc_psesion).toUpperCase() +
        ", Carta de no propiedad: \nDocumento de CORETT" + ", Acta de término" + ", Solicitud de Subsidio:" + ", Certificado de Recepción de Subsidio:"
        + ", Convenio de Adhesión:" + ", Pagare de convenio" + ", Contrato empresa" + ", Pagare empresa:" + ", Fianza de obra" + ", Contrato supervisión:" + ", Pagare supervisión: ", 52, 500, { lineBreak: true }, { font: 'Courier-Bold' });
    doc.text("Otros documentos\n N. Zona de mares de los cabos", 50, 560, { lineBreak: true }, { font: 'Courier-Bold' });


    doc.rect(50, 580, 500, 25).fillAndStroke('#ddd', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Clasificación y desclasificación de la información (ESTOS APARTADOS SÓLO SE LLENAN EN CASO DE QUE UN EXPEDIENTE HAYA\n                              SIDO SOLICITADO PARA DAR RESPUESTA A UNA SOLICITUD DE INFORMACIÓN DEL INAI)", 54, 583, { lineBreak: true }, { font: 'Courier-Bold' });
    doc.rect(50, 605, 130, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fecha de clasificación", 65, 610, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 620, 130, 10).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(150, 605, 100, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Periodo de reserva", 165, 610, { lineBreak: true }, { columnGap: 15 });
    doc.rect(150, 620, 100, 10).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 605, 300, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fundameto legal", 350, 610, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 620, 300, 10).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    //doc.text("######", 380, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 630, 100, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Ampliación del periodo de\n reserva", 52, 635, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 655, 100, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    // doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(150, 630, 100, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Fecha de la\ndesclasificación", 155, 635, { lineBreak: true }, { columnGap: 15 });
    doc.rect(150, 655, 100, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    // doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 630, 180, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(7);
    doc.text("Nombre, rúbrica y cargo del servidor público que\n                      desclasifica.", 260, 635, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 655, 180, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    // doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(430, 630, 120, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(7);
    doc.text("Indicar las partes o\n    secciones\n reservadas o ", 435, 633, { lineBreak: true }, { columnGap: 15 });
    doc.rect(430, 655, 120, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    // doc.text("X", 110, 465, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 630, 100, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Ampliación del periodo de\n reserva", 52, 635, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 655, 100, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.rect(50, 670, 200, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Nombre y rúbrica del titular de la Unidad Administrativa\n en caso de clasificar la información", 50, 673, { lineBreak: true }, { columnGap: 15 });
    doc.rect(250, 670, 300, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Nombre ", 253, 673, { lineBreak: true }, { columnGap: 15 });
    doc.rect(50, 695, 100, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Datos topográficos(ubicaci-\nónfísica del expediente)", 52, 700, { lineBreak: true }, { columnGap: 15 });
    doc.rect(150, 695, 160, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    //doc.text("", 52, 700, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 695, 130, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Nombre de quien hace la captura\n de esta caratula", 302, 700, { lineBreak: true }, { columnGap: 15 });
    doc.rect(430, 695, 120, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Ramon Hernandez Mata", 435, 705, { lineBreak: true }, { columnGap: 15 });
    doc.addPage();
    doc.save();
    doc.lineWidth(25);
    doc.lineCap('square')
        .moveTo(30, 50)
        .lineTo(580, 50)
        .fillAndStroke("#ddd")
        .stroke();
    doc.restore();
    doc.save();
    doc.fontSize(12);
    doc.font("Helvetica-Bold")
    doc.text("Documentación que integra el\n expediente del beneficiario", 30, 80, { align: "center" });
    doc.restore();

    doc.rect(50, 130, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Nombre del beneficiario", 52, 135, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 130, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].nombre_, 305, 135, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 155, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Clave CURP", 52, 160, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 155, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].curp, 305, 160, { lineBreak: true }, { columnGap: 15 });



    doc.rect(50, 180, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Clave CONAVI", 52, 190, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 180, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].folio, 305, 190, { lineBreak: true }, { columnGap: 15 });



    doc.rect(50, 205, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Comité", 52, 215, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 205, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].comite, 305, 215, { lineBreak: true }, { columnGap: 15 });

    doc.rect(50, 230, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Estado y Municipio", 52, 240, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 230, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].nombre_estado + "              " + api[0][0].nombre_municipio, 305, 240, { lineBreak: true }, { columnGap: 15 });

    doc.rect(50, 255, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Programa", 52, 265, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 255, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text(api[0][0].programa, 305, 265, { lineBreak: true }, { columnGap: 15 });




    if (api[0][0].ine == 'si') {
        doc.rect(50, 280, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Identificación Oficial", 52, 285, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 388, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 280, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 510, 288, { lineBreak: true }, { columnGap: 15 });
    } else {

        doc.rect(50, 280, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Identificación Oficial", 52, 285, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 388, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 280, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 288, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 280, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 510, 288, { lineBreak: true }, { columnGap: 15 });
    }


    if (api[0][0].curp_r == 'si') {
        doc.rect(50, 305, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Clave Única de registro de Población(CURP)", 52, 315, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 388, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 305, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 510, 320, { lineBreak: true }, { columnGap: 15 });
    } else {
        doc.rect(50, 305, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Clave Única de registro de Población(CURP)", 52, 315, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 388, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 305, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 320, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 305, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 510, 320, { lineBreak: true }, { columnGap: 15 });

    }


    if (api[0][0].acta_nacimiento == 'si') {
        doc.rect(50, 330, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Acta de Nacimiento", 52, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 388, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 330, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 510, 338, { lineBreak: true }, { columnGap: 15 });
    } else {
        doc.rect(50, 330, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Acta de Nacimiento", 52, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 388, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 330, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 338, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 330, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 510, 338, { lineBreak: true }, { columnGap: 15 });
    }


    if (api[0][0].comp_domicilio == 'si') {
        doc.rect(50, 355, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Comprobante de domicilio", 52, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 388, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 355, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 510, 363, { lineBreak: true }, { columnGap: 15 });
    } else {
        doc.rect(50, 355, 250, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("Comprobante de domicilio", 52, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(300, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("SI", 325, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(360, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("", 388, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(420, 355, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("NO", 440, 363, { lineBreak: true }, { columnGap: 15 });
        doc.rect(480, 355, 70, 25).fillAndStroke('#FFFFFF', '#000');
        doc.fill('#').stroke();
        doc.fontSize(8);
        doc.text("X", 510, 363, { lineBreak: true }, { columnGap: 15 });
    }





    doc.rect(50, 380, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Titulo de propiedad", 52, 388, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 380, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 388, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 380, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 388, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 380, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 388, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 380, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 388, { lineBreak: true }, { columnGap: 15 });

    doc.rect(50, 405, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Carta de no propiedad", 52, 413, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 405, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 413, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 405, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 413, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 405, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 413, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 405, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 413, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 430, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Documento de CORETT", 52, 438, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 430, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 438, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 430, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 438, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 430, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 438, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 430, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 438, { lineBreak: true }, { columnGap: 15 });



    doc.rect(50, 455, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Carta comprobante de ingreso", 52, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 455, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 463, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 455, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Acta de termino", 52, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 455, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 463, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 455, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 463, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 480, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Solicitud de Subsidio", 52, 488, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 480, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 488, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 480, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 488, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 480, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 488, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 480, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 488, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 505, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Certificado de Receoción de Subsidio", 52, 513, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 505, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 513, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 505, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 513, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 505, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 513, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 505, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 513, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 530, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Convenido de Adhesión", 52, 538, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 530, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 538, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 530, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 538, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 530, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 538, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 530, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 538, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 555, 250, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Pagare Convenio de Adhesión", 52, 563, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 555, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("SI", 325, 563, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 555, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 388, 563, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 555, 62.5, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("NO", 440, 563, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 555, 70, 25).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 510, 563, { lineBreak: true }, { columnGap: 15 });


    doc.rect(50, 580, 110, 70).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato", 85, 610, { lineBreak: true }, { columnGap: 15 });



    doc.rect(160, 580, 75, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 195, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(160, 595, 75, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato", 182, 600, { lineBreak: true }, { columnGap: 15 });


    doc.rect(235, 580, 65, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 263, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(235, 595, 65, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Pagare", 253, 600, { lineBreak: true }, { columnGap: 15 });


    doc.rect(300, 580, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 325, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(300, 595, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato", 315, 600, { lineBreak: true }, { columnGap: 15 });


    doc.rect(360, 580, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 385, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(360, 595, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Pagare", 375, 600, { lineBreak: true }, { columnGap: 15 });

    doc.rect(420, 580, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 445, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(420, 595, 60, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato", 430, 600, { lineBreak: true }, { columnGap: 15 });


    doc.rect(480, 580, 70, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("X", 515, 585, { lineBreak: true }, { columnGap: 15 });
    doc.rect(480, 595, 70, 15).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Pagare", 505, 600, { lineBreak: true }, { columnGap: 15 });



    doc.rect(160, 610, 140, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Obra a Precio Alzado", 182, 625, { lineBreak: true }, { columnGap: 15 });


    doc.rect(300, 610, 120, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato de Prestación de\n Servicios de Supervisión", 310, 620, { lineBreak: true }, { columnGap: 15 });


    doc.rect(420, 610, 130, 40).fillAndStroke('#FFFFFF', '#000');
    doc.fill('#').stroke();
    doc.fontSize(8);
    doc.text("Contrato de Prestación de\n Servicios Asistente Técnico", 430, 620, { lineBreak: true }, { columnGap: 15 });




}
// funcion para la creacion del documento
function Genera_PDFAcompanamientoa(api, res) {


    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {

        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename= CaratulaDelExpediente.pdf'
    });
    pdfAcompanamientoa(api, doc);
    doc.pipe(res);
    doc.fontSize(12);
    //Global Edits to All Pages (Header/Footer, etc)//
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);
        doc.lineWidth(7);
        // doc.lineCap('round')
        //     .moveTo(50, 750)
        //     .lineTo(550, 750)
        //     .fillAndStroke("#b8925f")
        //     .stroke();
        // doc.image("../headers/magon.png", 50, 20,
        //     { width: 500 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
        //         { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }
    doc.end();
}

/**EXPEDIENTE UNICO DIGITAL**/
app.post('/api/post_expediente', (req, res) => {
    const nombre = req.body.Nombres
    const apellidos = req.body.Apellidos
    const email = req.body.Email
    const password = req.body.Password
    // string consulta
    const sqlInsert = "call world.sp_post_expediente(?,?,?,?)"

    let a = db.query(sqlInsert, [
        nombre,
        apellidos,
        email,
        password],
        (err, result) => {
            // console.log("CONTAR DEL CORRREO", result[0])
            console.log(err)
            if (result[0] == undefined) {
                console.log("Hola que hace", result[0])
                console.log("SUCCESS");
                res.send("[{\"email\": \"VACIO\"\}]");
            } else {
                res.send("[{\"email\": \"ENCONTRADO\"\}]");
                console.log("WARNING");
            }

        });
});
app.get('/api/get_usuarios_expediente', (req, res) => {
    const sqlSelect = "SELECT id, nombre,apellidos,email,case when alcance = '99' then 'Administrador'when alcance = '1' then 'Campamento' when alcance = '0' then 'Usuario' end as Tipo_Usuario,concat('<i id=\"',email,'\"class=\"fas fa-user-clock\"></i>') as hola_ FROM world.cnfg_usuarios where perfil = 'ed_1' and status = 'R'";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        console.log(result)
    });

})
app.get('/api/get_expediente_tabla_ed/:email', (req, res) => {
    const email = req.params.email;
    const sqlSelect =
        "SELECT id, nombre,apellidos,email,case when alcance = '99' then 'Administrador' when alcance = '1' then 'Campamento' when alcance = '0' then 'Usuario' end as Tipo_Usuario,case when status = 'R' then 'Pediente por validar' end as Status, concat('<i id=\"',email,'\"class=\"fas fa-search\"></i>') as hola_  FROM world.cnfg_usuarios where perfil = 'ed_1' and email = ?";
    db.query(sqlSelect, [email], (err, result) => {
        res.send(result);
        console.log(err)


    });
});
app.post('/api/post_expediente_permiso', (req, res) => {
    const email = req.body.email
    const alcance = req.body.alcance
    //string consulta   
    const sqlInsert = "call world.ins_expediente(?,?)";  //PRODUCCION
    // ejecutar consulta
    let a = db.query(sqlInsert, [
        email,
        alcance],

        (err, result) => {
            console.log(err)
            res.send("[{\"OK\"\}]");
            console.log("REGISTRO GUARDADO CON EXITO")
        });

});
app.get('/api/get_altas_usuarios', (req, res) => {
    const sqlSelect = "SELECT id, nombre,apellidos,email,case when alcance = '99' then 'Administrador' when alcance = '1' then 'Campamento' when alcance = '0' then 'Usuario' end as Tipo_Usuario,case when status = 'R' then 'Pediente por validar' when status = 'A' then 'Validado' end as Status, concat('<i id=\"',email,'\"class=\"fas fa-user-check\"></i>') as hola_ FROM world.cnfg_usuarios where perfil = 'ed_1'";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        console.log(result)
    });

})









/***SERVIDOR DE EXUNDI***/





/**APIS PARA EL PMV**/
app.get('/api/get_pmv_tabla/:usuario', (req, res) => {


    const usuario = req.params.usuario;
    ObtenerPermisoPmv(usuario,
        function (result) {

            edos = result;
            console.log(edos)
            const sqlSelect = "SELECT c1.id_unico,txtCURP as curp,bloque,CONCAT(txtNombre,' ',txtPrimer_apellido, ' ',txtSegundo_apellido) AS Nombre,concat(txtCalle,' N° ',txtNum_int,' N.EXT ',txtNum_ext,' ',txtColonia,' ',txtCp,' ',IFNULL(l.nombre_localidad, ' '),', ',ce.nombre_estado ) as domicilio,concat('<i id=\"',c1.id_unico,'\"class=\"fas fa-caret-square-up\"></i>') as hola_ FROM prod_pmv.pmv_captura_c1 c1 LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = c1.cmbClave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = c1.cmbClave_estado AND mn.id_municipio = c1.cmbClave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = c1.cmbClave_localidad AND l.id_municipio = c1.cmbClave_municipio AND l.id_estado = c1.cmbClave_estado WHERE c1.cve_bajal = 'A' and c1.cmbClave_estado in(" + edos + ");";
            db.query(sqlSelect, (err, result) => {
                console.log(err)
                res.send(result);
            });

        });


});
app.get('/api/get_pmv_id/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =

        "call prod_pmv.sp_get_usPmv(?)";

    db.query(sqlSelect, [id_unico], (err, result) => {
        res.send(result[0]);
        console.log(result[0])
        console.log(err)
    });
});
app.get('/api/get_pmv_tabla_habitantes/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =

        "call prod_pmv.sp_get_habitantes(?)";

    db.query(sqlSelect, [id_unico], (err, result) => {

        console.log(result[0])
        res.send(result[0]);
        console.log(err)






    });
});
app.get('/api/get_pmv_tabla_habitantes_individual/:id', (req, res) => {
    const id = req.params.id;
    const sqlSelect =

        "call prod_pmv.sp_get_habitantes_Individual(?)";

    db.query(sqlSelect, [id], (err, result) => {

        //var string = result[0][0].imgb1_1.toString('base64'); 

        res.send(result[0]);
        console.log(result)
        console.log(err)


    });
});


/*PMV SOLVENTA*/
app.get('/api/get_benficiarios_solventa', (req, res) => {
    const sqlSelect =
        "SELECT ps.id_unico ,CURPR,concat (pcs.Nombre, ' ',pcs.Primer_apellido, ' ',pcs.Segundo_apellido) as Nombre,ps.cve_bajal, concat(ce.nombre_estado, ' ',mn.nombre_municipio, ' ', IFNULL(l.nombre_localidad, '')) as domicilio,concat('<i id=\"',ps.id_unico,'\"class=\"fas fa-info-circle\"></i>') as hola_  FROM prod_pmv.pmv_solventa ps join prod_pev.pev_captura_c2_sr pcs on pcs.id_unico = ps.id_unico LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = pcs.clave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = pcs.Clave_estado AND mn.id_municipio = pcs.Clave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = pcs.Clave_localidad AND l.id_municipio = pcs.Clave_municipio AND l.id_estado = pcs.Clave_estado where ps.cve_bajal = 'A'  group by id_unico;";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        console.log(result)
        res.send(result);
    });
});
app.get('/api/get_pmv_solventa/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =
        "call prod_pmv.sp_get_pmvSolventa(?)";
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err)
        res.send(result[0]);
    });
});
app.get('/api/get_solventa_pmv/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =

        "SELECT pcs.Nombre,pcs.Primer_apellido,pcs.Segundo_apellido,CURPR,Nombre_ine,Primer_apellido_ine,Segundo_apellido_ine,folio, curp, modulo, Pintura, Puertas, Impermeabilizacion, electrica, hidraulica, Ecotecnias, Fosa, Exteriores, Techo, Muros, Firme, Cuarto, Bano, Cocina, Estructurales, Terminacion, ps.Cuenta_ayude_trabajos, Beneficiario_aporto, Cantidad_aporto, TO_BASE64  (imgEvidencia_carta) as imgEvidencia_carta, TO_BASE64 (imgEvidencia_entrega) as imgEvidencia_entrega,  ps.cve_bajal, ps.id_unico FROM prod_pmv.pmv_solventa ps join prod_pev.pev_captura_c2_sr pcs on pcs.id_unico = ps.id_unico where ps.id_unico = ? and ps.cve_bajal ='A'  group by id_unico;";
    db.query(sqlSelect, [id_unico], (err, result) => {
        //console.log("resultado: ", result[0])
        res.send(result);
        console.log(err)



    });
});





// app.get('/api/get_img_solventa/:id_unico', (req, res) => {
//     const id_unico = req.params.id_unico;
//     const sqlSelect =
//         "SELECT  \n"
//         + "id_unico, \n"
//         + "TO_BASE64(imgEvidencia_carta) AS imgEvidencia_carta, \n"
//         + "TO_BASE64(imgEvidencia_entrega) AS imgEvidencia_entrega, \n"
//         + "CONCAT('imgEvidencia_carta_ ', \n"
//         + "curp, \n"
//         + "'_', \n"
//         + "id_unico, \n"
//         + "'.jpg') AS imgEvidencia_carta_, \n"
//         + "CONCAT('imgEvidencia_entrega ', \n"
//         + "curp, \n"
//         + "'_', \n"
//         + "id_unico, \n"
//         + "'.jpg') AS imgEvidencia_entrega_ \n"
//         + "FROM \n"
//         + "prod_pmv.pmv_solventa \n"
//         + "WHERE \n"
//         + "id_unico = ?"
//     db.query(sqlSelect, [id_unico], (err, result) => {
//         console.log(err)
//         res.send(result[0]);
//     });
// });
// app.get('/api/get_img_PmvFotos/:id_unico', (req, res) => {
//     const id_unico = req.params.id_unico;
//     const sqlSelect = "call prod_pmv.sp_fotos_pmvc1(?);"
//     db.query(sqlSelect, [id_unico], (err, result) => {
//         console.log(err)
//         res.send(result[0]);
//     });
// });









































/*PDF PARA REPORTE DEL PMV*/
//**CUESTIONARIO PMV**//
// app.get('/api/get_pmv_c1/:id_unico', (req, res) => {
//     const id_unico = req.params.id_unico;
//     const sqlSelect = "call prod_pmv.sp_get_usPmv(?)";
//     // ejecurtar consulta
//     db.query(sqlSelect, [id_unico], (err, result) => {
//         console.log(err);
//         if (result == "") { } else { // res.send(result[0])
//             genera_pdf_pmv(result[0], res);

//         }
//     });
// })


// function pdfPmv(obj, doc) {
//     doc.font("Times-Bold").fontSize(13).fillColor('#661e2c').text(`VISITA DE IDENTIFICACIÓN DE PERSONAS BENEFICIARIAS CUESTIONARIO 1 (C1)`, 35, 60, {
//         width: 500,
//         align: 'center'
//     });
//     doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 100, {
//         width: 500,
//         align: 'center'
//     });
//     if (obj[0].cedula[0][0].txtDificultadDiscapacidad == 'NO') {
//         var problema = 'Salud'
//     } else {
//         problema = 'Nacimiento'
//     }
//     if (obj[0].cedula[0][0].Derechohabiente == 'SI') {
//         doc.fill('#b8925f').stroke()
//         doc.fontSize(8)
//             .text("Que tipo de servicio", 170, 200, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8)
//             .text(obj[0].cedula[0][0].DescripcionDerechohabiente, 170, 210, { align: "left" })
//             .moveDown();
//     } else {
//         let fZiceT = 8
//         let moveLeft = 175
//         if (obj[0].cedula[0][0].txtDerechohabiente.length == 15) {
//             fZiceT = 7
//             moveLeft = 150
//         }
//         doc.fill('#b8925f').stroke()
//         doc.fontSize(8)
//             .text("Que tipo de servicio", 170, 210, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(fZiceT)
//             .text(obj[0].cedula[0][0].txtDerechohabiente, moveLeft, 220, { align: "left" })
//             .moveDown();
//     }
//     if (obj[0].cedula[0][0].Tiene_Discapacidad == 'NO') {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8)
//             .text("¿Es una persona con discapacidad?", 450, 210, { align: "left" })
//             .text("¿Cuál es su último grado de estudios?", 50, 230, { align: "left" })
//             .text("¿Hace 5 años en qué estado de la República Mexicana o país vivían?", 200, 230, { align: "left" })
//             .text("¿Migra constantemente?", 450, 230, { align: "left" })
//             .text("¿Recibe ingresos por?", 50, 260, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8)
//             .text(obj[0].cedula[0][0].Tiene_Discapacidad, 500, 220, { align: "left" })
//             .text(obj[0].cedula[0][0].Grado_Estudios, 80, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].Estado_Vivían, 300, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].Migrante, 480, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].Tipo_Ingresos, 55, 270, { align: "left" })
//         if (obj[0].cedula[0][0].Tipo_Ingresos == 'Otro') {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8)
//                 .text("Ingresos por", 150, 260, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8)
//                 .text(obj[0].cedula[0][0].txtTipoIngresos, 145, 270, { align: "left" })
//                 .moveDown();
//         }
//     } else {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8)
//             .text("¿Es una persona con discapacidad?", 450, 200, { align: "left" })
//             .text("¿La discapacidad que presenta es por un problema de? ", 50, 230, { align: "left" })
//             .text("¿Es una dificultad para?", 280, 230, { align: "left" })
//             .text("La dificultad es por: ", 430, 230, { align: "left" })
//             .text("¿Tiene enfermedad degenerativa? ", 50, 260, { align: "left" })
//             .text("¿Cuál es su último grado de estudios?", 220, 260, { align: "left" })
//             .text("¿Hace 5 años en qué estado de la República Mexicana o país vivían?", 380, 260, { align: "left" })
//             .text("¿Migra constantemente?", 50, 290, { align: "left" })
//             .text("¿Recibe ingresos por?", 200, 290, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8)
//             .text(obj[0].cedula[0][0].Tiene_Discapacidad, 500, 210, { align: "left" }) // 
//             .text(problema, 90, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].txtDificultadDiscapacidad, 250, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].Causa_Dificultad, 440, 240, { align: "left" })
//             .text(obj[0].cedula[0][0].Degenerativa, 100, 270, { align: "left" })
//             .text(obj[0].cedula[0][0].Grado_Estudios, 260, 270, { align: "left" })
//             .text(obj[0].cedula[0][0].Estado_Vivían, 450, 270, { align: "left" })
//             .text(obj[0].cedula[0][0].Migrante, 90, 300, { align: "left" })
//             .text(obj[0].cedula[0][0].Tipo_Ingresos, 200, 300, { align: "left" })
//             .moveDown();
//     }
//     if (obj[0].cedula[0][0].Actividad_Economica == 'Otro') {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8)
//             .text("CURP de la persona solicitante:", 50, 120, { align: "left" })
//             .text("Nombre de la persona solicitante:", 220, 120, { align: "left" })
//             .text("Género:", 390, 120, { align: "left" })
//             .text("Fecha de nacimiento de la persona solicitante ", 450, 120, { align: "left" })
//             .text("Tipo de identificación oficial vigente", 50, 150, { align: "left" })
//             .text("No. de identificación oficial vigente", 200, 150, { align: "left" })
//             .text("Actividad económica ", 350, 150, { align: "left" })
//             .text("Tipo de actividad economica", 460, 150, { align: "left" })
//             .text("Medios de contacto", 70, 180, { align: "left" })
//             .text("¿Es jefe/jefa de hogar? ", 180, 180, { align: "left" })
//             .text("¿Se considera indígena?", 310, 180, { align: "left" })
//             .text("¿Es madre soltera? ", 430, 180, { align: "left" })
//             .text("¿Es derechohabiente?  ", 50, 210, { align: "left" })
//             .text("¿Contribuye al ingreso familiar? ", 320, 210, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8)
//             .text(obj[0].cedula[0][0].txtCURP, 60, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].nombre, 200, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].genero, 390, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].txtFecha_nacimiento, 500, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].Tipo_Identificacion, 55, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].txtId, 230, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].Actividad_Economica, 370, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].txtActividadEconomica, 480, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].txtTelefono + ' y ' + obj[0].cedula[0][0].txtTelefono_alterno, 60, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Jefe_Hogar, 210, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Indigena, 340, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Madre_Soltera, 450, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Derechohabiente, 80, 220, { align: "left" }) //
//             .text(obj[0].cedula[0][0].Contribuye_Ingreso, 370, 220, { align: "left" })
//             .moveDown();
//     } else {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8)
//             .text("CURP de la persona solicitante:", 50, 120, { align: "left" })
//             .text("Nombre de la persona solicitante:", 220, 120, { align: "left" })
//             .text("Género:", 390, 120, { align: "left" })
//             .text("Fecha de nacimiento de la persona solicitante ", 450, 120, { align: "left" })
//             .text("Tipo de identificación oficial vigente", 50, 150, { align: "left" })
//             .text("No. de identificación oficial vigente", 200, 150, { align: "left" })
//             .text("Actividad económica ", 400, 150, { align: "left" })
//             .text("Medios de contacto", 70, 180, { align: "left" })
//             .text("¿Es jefe/jefa de hogar? ", 180, 180, { align: "left" })
//             .text("¿Se considera indígena?", 310, 180, { align: "left" })
//             .text("¿Es madre soltera? ", 430, 180, { align: "left" })
//             .text("¿Es derechohabiente?  ", 70, 210, { align: "left" })
//             .text("¿Contribuye al ingreso familiar? ", 270, 210, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8)
//             .text(obj[0].cedula[0][0].txtCURP, 60, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].nombre, 200, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].genero, 390, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].txtFecha_nacimiento, 500, 130, { align: "left" })
//             .text(obj[0].cedula[0][0].Tipo_Identificacion, 55, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].txtId, 230, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].Actividad_Economica, 410, 160, { align: "left" })
//             .text(obj[0].cedula[0][0].txtTelefono + ' y ' + obj[0].cedula[0][0].txtTelefono_alterno, 60, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Jefe_Hogar, 210, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Indigena, 340, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Madre_Soltera, 450, 190, { align: "left" })
//             .text(obj[0].cedula[0][0].Derechohabiente, 100, 220, { align: "left" }) //dd
//             .text(obj[0].cedula[0][0].Contribuye_Ingreso, 320, 220, { align: "left" })
//             .moveDown();
//     }


//     doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Fotografias Documentos solicitante`, 35, 320, {
//         width: 500,
//         align: 'center'
//     });
//     // IMAGEN 1
//     try {
//         if (obj[0].cedula[0][0].imgb1_1 != "") {
//             doc.image(new Buffer(obj[0].cedula[0][0].imgb1_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_1), 'base64'), 50, 370,
//                 { width: 150, height: 150 });
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Anverso de la CURP del solicitante', 65, 360)

//         }
//     } catch (e) { }
//     try {
//         if (obj[0].cedula[0][0].imgb1_3 != "") {
//             doc.image(new Buffer(obj[0].cedula[0][0].imgb1_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_3), 'base64'), 230, 370,
//                 { width: 150, height: 150 });
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Anverso de la INE del solicitante', 250, 360)

//         }
//     } catch (e) { }
//     try {
//         if (obj[0].cedula[0][0].imgb1_4 != "") {
//             doc.image(new Buffer(obj[0].cedula[0][0].imgb1_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_4), 'base64'), 410, 370,
//                 { width: 150, height: 150 });
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Reverso de la INE del solicitante', 430, 360)
//         }
//     } catch (e) { }
//     doc.addPage();
//     // Bloque 2

//     doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 2 "DOMICILIO DE LA VIVIENDA"`, 35, 60, {
//         width: 500,
//         align: 'center'
//     });
//     doc.fill('#b8925f').stroke();
//     doc.fontSize(8).text("Entidad", 50, 80, { align: "left" })
//     doc.fontSize(8).text("Municipio", 150, 80, { align: "left" })
//     doc.fontSize(8).text("Localidad", 250, 80, { align: "left" })
//     doc.fontSize(8).text("Código Postal", 430, 80, { align: "left" })
//     doc.fontSize(8).text("Dirección (Calle, número, colonia)", 50, 110, { align: "left" })
//     doc.fontSize(8).text("Tipo de propiedad o posesión de la vivienda", 250, 110, { align: "left" })
//     doc.fontSize(8).text("La persona solicitante, ¿es la propietaria de la vivienda?", 400, 110, { align: "center" })
//         .moveDown();
//     var FuenteMunicipio = 8;
//     var Pmunicipio = 150;
//     if (obj[0].cedula[0][0].Nombre_municipio.length >= 20) {
//         FuenteMunicipio = 6;
//         Pmunicipio = 130;
//     }
//     var Pdomicilio = 50;
//     let FDomicilio = 8;
//     let fontLocalidad = 8
//     var Plocalidad = 240;
//     if (obj[0].cedula[0][0].Nombre_localidad.length >= 25) {
//         fontLocalidad = 8
//         Plocalidad = 210;
//     }
//     console.log("palabrs dentro del municipio", obj[0].cedula[0][0].domicilio.length)

//     if (obj[0].cedula[0][0].domicilio.length >= 30) {
//         Pdomicilio = 40
//         FDomicilio = 7

//     }
//     doc.fill('#').stroke();
//     doc.fontSize(8).text(obj[0].cedula[0][0].Nombre_estado, 50, 90, { align: "left" })
//     doc.fontSize(FuenteMunicipio).text(obj[0].cedula[0][0].Nombre_municipio, Pmunicipio, 90, { align: "left" })
//     doc.fontSize(fontLocalidad).text(obj[0].cedula[0][0].Nombre_localidad, Plocalidad, 90, { align: "left" })
//     doc.fontSize(8).text(obj[0].cedula[0][0].txtCp, 440, 90, { align: "left" })
//     doc.fontSize(FDomicilio).text(obj[0].cedula[0][0].domicilio, Pdomicilio, 120, { align: "left" })
//     doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Propiedad, 300, 120, { align: "left" })
//     doc.fontSize(8).text(obj[0].cedula[0][0].EsPropietario, 515, 120, { align: "left" })
//         .moveDown();



//     if (obj[0].cedula[0][0].Tipo_Propiedad == 'Propia' && obj[0].cedula[0][0].Bloque != '3') {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
//         doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
//         doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
//         doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
//             , 300, 170, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
//         doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
//             .moveDown();
//         if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
//             let Fonte = 7
//             let Adrss = 200
//             if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
//                 Fonte = 6
//                 Adrss = 180
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
//                 .moveDown();
//         }
//         if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
//         } else {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
//             doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

//         }

//         doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
//             width: 500,
//             align: 'center'
//         });
//         try {
//             if (obj[0].cedula[0][0].imgb2_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_5 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_6 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//             }
//         } catch (e) { }
//         doc.addPage();
//         try {
//             if (obj[0].cedula[0][0].imgb2_7 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_8 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_9 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgFirma != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//             }
//         } catch (e) { }
//         doc.addPage();

//         //Bloque3
//         if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
//             obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_autopista == '') {
//             obj[0].cedula[0][0].Encuentra_autopista = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_tren == '') {
//             obj[0].cedula[0][0].Encuentra_tren = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_torres == '') {
//             obj[0].cedula[0][0].Encuentra_torres = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_ductos == '') {
//             obj[0].cedula[0][0].Encuentra_ductos = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_rio == '') {
//             obj[0].cedula[0][0].Encuentra_rio = 'NO'
//         }
//         if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
//             obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
//         }
//         if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
//             obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
//         }
//         if (obj[0].cedula[0][0].Muros == '') {
//             obj[0].cedula[0][0].Muros = 'NO'
//         }
//         if (obj[0].cedula[0][0].Pisos == '') {
//             obj[0].cedula[0][0].Pisos = 'NO'
//         }
//         if (obj[0].cedula[0][0].Techo == '') {
//             obj[0].cedula[0][0].Techo = 'NO'
//         }
//         if (obj[0].cedula[0][0].Inclinacion == '') {
//             obj[0].cedula[0][0].Inclinacion = 'NO'
//         }
//         if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
//             obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
//         }




//         doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
//             width: 500,
//             align: 'center'
//         });
//         doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 85, {
//             width: 500,
//             align: 'center'
//         });
//         doc.fill('#').stroke();
//         doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
//         doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
//         doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
//         doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
//         doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
//         doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
//         doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
//         doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
//             .moveDown();
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

//         try {
//             if (obj[0].cedula[0][0].imgb3_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb3_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb3_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb3_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

//             }
//         } catch (e) { }
//         doc.addPage();

//         //Bloque4


//         if (obj[0].cedula[0][0].Muros == 'SI' || obj[0].cedula[0][0].Pisos == 'SI' || obj[0].cedula[0][0].Techo == 'SI' || obj[0].cedula[0][0].Inclinacion == 'SI') {
//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 10, 80, {
//                 width: 600,
//                 align: 'center'
//             });
//             doc.fill('#').stroke();
//             doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
//             doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
//             doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
//             doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
//             doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
//                 .moveDown();
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
//                 .moveDown();
//             try {
//                 if (obj[0].cedula[0][0].imgb4_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb4_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb4_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb4_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

//                 }
//             } catch (e) { }

//             doc.rect(30, 650, 500, 25).fillAndStroke('#ffffff');

//             doc.fill('#661e2c').stroke();
//             doc.fontSize(13);
//             doc.text("NOTA: EXISTEN RIESGOS INTERNOS EN LA VIVIENDA POSIBLE APOYO POR CANCELAR",
//                 35, 655, { lineBreak: false });




//         } else {



//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.fill('#').stroke();
//             doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
//             doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
//             doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
//             doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
//             doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
//                 .moveDown();
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
//                 .moveDown();
//             try {
//                 if (obj[0].cedula[0][0].imgb4_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb4_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb4_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb4_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

//                 }
//             } catch (e) { }
//         }
//         doc.addPage();
//         let ahorros_F = 8
//         let ahorros_P = 80
//         if (obj[0].cedula[0][0].Cuenta_Ahorros.length >= 25) {

//             ahorros_F = 6
//             ahorros_P = 45
//         }
//         doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 5 "DATOS SOCIOECONÓMICOS DE LA VIVIENDA"`, 50, 75, {
//             width: 500,
//             align: 'center'
//         });
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso total mensual?", 50, 100, { align: "left" })
//         doc.fontSize(8).text("Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda?", 250, 100, { align: "left" })
//         doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso mensual familiar?", 50, 125, { align: "left" })
//         doc.fontSize(7).text("¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra?", 250, 125, { align: "left" })
//         doc.fontSize(8).text("¿Usted cuenta con cuentas de ahorro?", 50, 150, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualI, 100, 110, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Integrantes_Contribuyen, 400, 110, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualF, 100, 135, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Ayuda_Trabajos, 350, 133, { align: "left" })
//         doc.fontSize(ahorros_F).text(obj[0].cedula[0][0].Cuenta_Ahorros, ahorros_P, 160, { align: "left" })
//             .moveDown();


//         if (obj[0].cedula[0][0].Cuenta_Ahorros == 'No cuenta con ninguna') {
//             if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
//                 doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 50, 180, { align: "left" })
//                 doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 180, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 220, 160, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 80, 190, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 390, 190, { align: "left" })
//                     .moveDown();
//                 if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("A quien pidio prestado", 50, 210, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 50, 220, { align: "left" })
//                 }
//             } else {
//                 let FuenteCredito = 8;
//                 let PosCredito = 220;
//                 if (obj[0].cedula[0][0].Tarjetas_Credito.length >= 25) {
//                     FuenteCredito = 7;
//                     PosCredito = 200;
//                 }
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(FuenteCredito).text(obj[0].cedula[0][0].Tarjetas_Credito, PosCredito, 160, { align: "left" })
//                     .moveDown();
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 150, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 380, 160, { align: "left" })
//                     .moveDown();
//                 if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("A quien pidio prestado", 50, 180, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 65, 190, { align: "left" })
//                 }


//             }

//         } else {
//             if (obj[0].cedula[0][0].cmbCuentaAhorros <= 6) {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Si tiene tarjeta de débito (de las señaladas en la pregunta anterior) generalmente, ¿cuántas veces al mes utiliza su tarjeta de débito para pagar compras en establecimientos comerciales, tiendas o restaurantes?", 240, 150, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Debito, 290, 168, { align: "left" })
//                     .moveDown();
//                 if (obj[0].cedula[0][0].nuevo_catalogo <= 2) {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿Cuál es la razón principal por la que no utiliza o casi no utiliza su tarjeta de débito para hacer compras o pagos?", 50, 185, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Usa_DebitoMes, 50, 195, { align: "left" })
//                         .moveDown();
//                 }
//                 if (obj[0].cedula[0][0].usa_debito_mes == 10) {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Especifique", 50, 210, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].txtUsaDebitoMes, 50, 220, { align: "left" })
//                         .moveDown();


//                 }
//                 if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 50, 220, { align: "left" })
//                     doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 200, 220, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 50, 230, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 250, 230, { align: "left" })
//                         .moveDown();
//                 }






//             }

//         }






//         /*BLOQUE6*/

//         if (obj[0].integrantes == '[]') {
//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
//                 width: 500,
//                 align: 'center'
//             });

//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
//         } else {


//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
//                 width: 500,
//                 align: 'center'
//             });

//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
//             try {
//                 if (obj[0].cedula[0][0].imgb6_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb6_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_1), 'base64'), 100, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los Integrantes', 80, 270)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb6_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb6_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_2), 'base64'), 350, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los Integrantes', 340, 270)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb6_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb6_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_3), 'base64'), 100, 480,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los Integrantes', 80, 470)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb6_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_4), 'base64'), 350, 480,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los Integrantes', 340, 470)

//                 }
//             } catch (e) { }
//             doc.addPage({ layout: 'landscape' })

//             const table = {
//                 headers: ["id_unico", "Curp", "Nombre", "Edad integrante", "Genero", "Dependiente beneficirio", "Feje de hogar", "Madre soltera", "Derecho habiente", "Se considera indigena", "Contribuye ingreso", "Actividad economica", "A que se dedica", "Parentesco integrante", "Tiene discapacidad", "Problema discapacidad", "Causa dificultad", "Enfermedad degenerativa", "Grado estudios", "Estado vivian", "Es migranre", "Tipo migrante", "Tipo ingreso", "Qué tipo de ingresos"],
//                 rows: []
//             };
//             let patients = obj[0].integrantes
//             for (const patient of patients) {
//                 table.rows.push([patient.id_unico, patient.curp_integrante, patient.nombre_integrante, patient.edad_integrante, patient.sex, patient.Dependiente_benefIntegrante, patient.Feje_hogarIntegrante, patient.MadreSolteraIntegrante, patient.DerechohabienteIteraIntegrante, patient.IndigenaI, patient.ContribuyeIngresoIteraIntegrante, patient.ActividadEconomicaI, patient.QuehaceIntegrante, patient.ParentescoIntegrante, patient.TieneDiscapacidadIntegrante, patient.ProblemaDiscapacidadIntegrante, patient.CausaDificultadIntegrante, patient.DegenerativaIntegrante, patient.GradoEstudiosIntegrante, patient.Estado_Vivían, patient.MigranteI, patient.TipoMigracionIntegrante, patient.TipoIngresosIntegrante, patient.txtTipoIngresosI])

//             }
//             doc.table(table, {
//                 x: 25,
//                 y: 130,
//                 columnSpacing: 5,
//                 padding: 1,
//                 columnsSize: [100, 100, 135],
//                 prepareHeader: () => doc.font("Times-Roman").fontSize(10).fillColor("#000000"),
//                 prepareRow: () => doc.font("Times-Roman").fontSize(5),

//             });

//         }
//         doc.addPage();

//         doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 7 "CARACTERÍSTICAS DE LA VIVIENDA"`, 50, 60, {
//             width: 500,
//             align: 'center'
//         });
//         var matMuros = 8;
//         var pMuros = 50;
//         if (obj[0].cedula[0][0].MatMuros.length >= 20) {
//             matMuros = 8;
//             pMuros = 30;
//         }
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text("¿Cuántas recámaras tiene la vivienda?", 50, 90, { align: "left" })
//         doc.fontSize(8).text("¿De qué material es el techo de la vivienda?", 220, 90, { align: "left" })
//         doc.fontSize(8).text("¿Con qué tipo de piso cuenta la vivienda?", 400, 90, { align: "left" })
//         doc.fontSize(8).text("¿De qué material son los muros de la vivienda?", 50, 110, { align: "left" })
//         doc.fontSize(8).text("¿La vivienda cuenta con escusado?", 250, 110, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Recamaras, 100, 100, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].MatTecho, 260, 100, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].MatPiso, 420, 100, { align: "left" })
//         doc.fontSize(matMuros).text(obj[0].cedula[0][0].MatMuros, pMuros, 118, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Escusado, 290, 120, { align: "left" })
//         if (obj[0].cedula[0][0].Escusado == 'NO') {
//             let txtCocinarP = 240;
//             let txtCocinarF = 8;
//             let txtEscusadoP = 400
//             let txtEscusadoF = 8
//             let txtEscusadoU = 120
//             if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
//                 txtCocinarP = 180
//                 txtCocinarF = 7
//             }
//             if (obj[0].cedula[0][0].txtEscusado.length >= 30) {
//                 txtEscusadoP = 380
//                 txtEscusadoF = 6
//                 txtEscusadoU = 117
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Que servicio ocupa", 400, 110, { align: "left" })
//             doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 50, 140, { align: "left" })
//             doc.fontSize(8).text("¿Cuenta con drenaje?", 190, 140, { align: "left" })
//             doc.fontSize(8).text("¿Cuenta con agua potable?", 290, 140, { align: "left" })
//             doc.fontSize(8).text("Frecuencia del servicio de agua potable", 400, 140, { align: "left" })
//             doc.fill('#').stroke();
//             doc.fontSize(txtEscusadoF).text(obj[0].cedula[0][0].txtEscusado, txtEscusadoP, 120, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 90, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 230, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 310, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 430, 150, { align: "left" })
//             if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                 doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 220, 170, { align: "left" })
//                     // doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 400, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                 doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
//                     //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 450, 180, { align: "left" })
//                     .moveDown();
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                 doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
//                     //doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
//                     // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 178, { align: "left" })
//                     .moveDown();
//             }
//             if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 50, 200, { align: "left" })
//                 doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 280, 200, { align: "left" })
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 50, 210, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 310, 210, { align: "left" })
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                 //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
//                 doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                 //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 180, { align: "left" })
//                     .moveDown();
//             }




//         } else {
//             let txtCocinarP = 50;
//             let txtCocinarF = 8;
//             if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
//                 txtCocinarP = 180
//                 txtCocinarF = 7
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 400, 110, { align: "left" })
//             doc.fontSize(8).text("¿Cuenta con drenaje?", 50, 140, { align: "left" })
//             doc.fontSize(8).text("¿Cuenta con agua potable?", 150, 140, { align: "left" })
//             doc.fontSize(8).text("Frecuencia del servicio de agua potable", 260, 140, { align: "left" })
//             doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 400, 140, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 450, 120, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 80, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 190, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 310, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 450, 150, { align: "left" })
//                 .moveDown();
//             if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 50, 170, { align: "left" })
//                 doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 250, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 300, 180, { align: "left" })
//                     .moveDown();
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 50, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 80, 180, { align: "left" })
//                     .moveDown();
//             }

//             if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 450, 170, { align: "left" })
//                 doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 450, 190, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
//                     .moveDown();
//             }


//             if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
//                 console.log("jasdlkashdasjkhd", obj[0].cedula[0][0].Trat_Basura)
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
//                     .moveDown();
//             }
//             if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
//                     .moveDown();
//             }


//         }


//         try {
//             if (obj[0].cedula[0][0].imgb7_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb7_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_1), 'base64'), 100, 250,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de las características de la vivienda', 80, 240)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb7_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb7_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_2), 'base64'), 350, 250,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de las características de la vivienda', 340, 240)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb7_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb7_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_3), 'base64'), 100, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de las características de la vivienda', 80, 440)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb7_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb7_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_4), 'base64'), 350, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de las características de la vivienda', 340, 440)

//             }
//         } catch (e) { }

//     }
//     if (obj[0].cedula[0][0].Tipo_Propiedad == 'Rentada') {
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
//         doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
//         doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
//         doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
//             , 300, 170, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
//         doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
//             .moveDown();
//         if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
//             let Fonte = 7
//             let Adrss = 200
//             if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
//                 Fonte = 6
//                 Adrss = 180
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
//                 .moveDown();
//         }
//         if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
//         } else {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
//             doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

//         }

//         doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
//             width: 500,
//             align: 'center'
//         });
//         try {
//             if (obj[0].cedula[0][0].imgb2_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

//             }
//         } catch (e) {

//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
//         }

//         try {
//             if (obj[0].cedula[0][0].imgb2_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//             }
//         } catch (e) {

//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//         }

//         try {
//             if (obj[0].cedula[0][0].imgb2_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//             }
//         } catch (e) {

//             doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//         }

//         try {
//             if (obj[0].cedula[0][0].imgb2_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//             }
//         } catch (e) {
//             doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//         }
//         try {
//             if (obj[0].cedula[0][0].imgb2_5 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//             }
//         } catch (e) {
//             doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//         }
//         try {
//             if (obj[0].cedula[0][0].imgb2_6 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//             }
//         } catch (e) {
//             doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//         }
//         doc.addPage();
//         try {
//             if (obj[0].cedula[0][0].imgb2_7 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//             }
//         } catch (e) {
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//         }
//         try {
//             if (obj[0].cedula[0][0].imgb2_8 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//             }
//         } catch (e) {
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//         }
//         try {
//             if (obj[0].cedula[0][0].imgb2_9 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//             }
//         } catch (e) {
//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//         }
//         try {
//             if (obj[0].cedula[0][0].imgFirma != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//             }
//         } catch (e) {

//             doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//         }



//         doc.rect(80, 450, 460, 25).fillAndStroke('#FFFFFF');
//         doc.fill('#661e2c').stroke();
//         doc.fontSize(16);
//         doc.text("NOTA: LA VIVIENDA ES " + obj[0].cedula[0][0].Tipo_Propiedad.toUpperCase() + " POSIBLE APOYO A CANCELAR", 50, 455, { lineBreak: false });
//     }
//     if (obj[0].cedula[0][0].Tipo_Propiedad == 'Prestada') {

//         console.log("asdasdasd", obj[0].cedula[0][0].Bloque)

//         if (obj[0].cedula[0][0].Autorizacion_Propietario == 'NO' && obj[0].cedula[0][0].Bloque != 7) {

//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
//             doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
//             doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
//             doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
//                 , 300, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
//             doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
//                 .moveDown();
//             if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
//                 let Fonte = 7
//                 let Adrss = 200
//                 if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
//                     Fonte = 6
//                     Adrss = 180
//                 }
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
//                     .moveDown();
//             }
//             if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
//                 doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
//                 doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

//             }

//             doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
//                 width: 500,
//                 align: 'center'
//             });
//             try {
//                 if (obj[0].cedula[0][0].imgb2_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_5 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_6 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//             }
//             doc.addPage();
//             try {
//                 if (obj[0].cedula[0][0].imgb2_7 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_8 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_9 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgFirma != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//             }

//             /*ALERTA*/
//             doc.rect(80, 450, 460, 25).fillAndStroke('#FFFFFF');
//             doc.fill('#661e2c').stroke();
//             doc.fontSize(16);
//             doc.text("NOTA: LA VIVIENDA ES " + obj[0].cedula[0][0].Tipo_Propiedad.toUpperCase() + " POSIBLE APOYO A CANCELAR", 50, 455, { lineBreak: false });

//         } else {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
//             doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
//             doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
//             doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
//                 , 300, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
//             doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
//                 .moveDown();
//             if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
//                 let Fonte = 7
//                 let Adrss = 200
//                 if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
//                     Fonte = 6
//                     Adrss = 180
//                 }
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
//                     .moveDown();
//             }
//             if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
//             } else {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
//                 doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
//                 doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

//             }

//             doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
//                 width: 500,
//                 align: 'center'
//             });
//             try {
//                 if (obj[0].cedula[0][0].imgb2_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//                 }
//             } catch (e) {

//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb2_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_5 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_6 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
//                         { width: 150, height: 150 });
//                     doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//                 }
//             } catch (e) {
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//             }
//             doc.addPage();
//             try {
//                 if (obj[0].cedula[0][0].imgb2_7 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_8 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgb2_9 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//                 }
//             } catch (e) {
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//             }
//             try {
//                 if (obj[0].cedula[0][0].imgFirma != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//                 }
//             } catch (e) {

//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//             }
//             doc.addPage();

//             //Bloque3
//             if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
//                 obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
//             }
//             if (obj[0].cedula[0][0].Encuentra_autopista == '') {
//                 obj[0].cedula[0][0].Encuentra_autopista = 'NO'
//             }
//             if (obj[0].cedula[0][0].Encuentra_tren == '') {
//                 obj[0].cedula[0][0].Encuentra_tren = 'NO'
//             }
//             if (obj[0].cedula[0][0].Encuentra_torres == '') {
//                 obj[0].cedula[0][0].Encuentra_torres = 'NO'
//             }
//             if (obj[0].cedula[0][0].Encuentra_ductos == '') {
//                 obj[0].cedula[0][0].Encuentra_ductos = 'NO'
//             }
//             if (obj[0].cedula[0][0].Encuentra_rio == '') {
//                 obj[0].cedula[0][0].Encuentra_rio = 'NO'
//             }
//             if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
//                 obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
//             }
//             if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
//                 obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
//             }
//             if (obj[0].cedula[0][0].Muros == '') {
//                 obj[0].cedula[0][0].Muros = 'NO'
//             }
//             if (obj[0].cedula[0][0].Pisos == '') {
//                 obj[0].cedula[0][0].Pisos = 'NO'
//             }
//             if (obj[0].cedula[0][0].Techo == '') {
//                 obj[0].cedula[0][0].Techo = 'NO'
//             }
//             if (obj[0].cedula[0][0].Inclinacion == '') {
//                 obj[0].cedula[0][0].Inclinacion = 'NO'
//             }
//             if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
//                 obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
//             }




//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 70, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.fill('#').stroke();
//             doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
//             doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
//             doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
//             doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
//             doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
//             doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
//             doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
//             doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

//             try {
//                 if (obj[0].cedula[0][0].imgb3_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb3_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb3_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb3_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

//                 }
//             } catch (e) { }
//             doc.addPage();

//             //Bloque4


//             if (obj[0].cedula[0][0].Muros == 'SI' || obj[0].cedula[0][0].Pisos == 'SI' || obj[0].cedula[0][0].Techo == 'SI' || obj[0].cedula[0][0].Inclinacion == 'SI') {
//                 doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
//                     width: 500,
//                     align: 'center'
//                 });
//                 doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
//                     width: 500,
//                     align: 'center'
//                 });
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
//                 doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
//                 doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
//                 doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
//                 doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
//                     .moveDown();
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
//                     .moveDown();
//                 try {
//                     if (obj[0].cedula[0][0].imgb4_1 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

//                     }
//                 } catch (e) { }

//                 try {
//                     if (obj[0].cedula[0][0].imgb4_2 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

//                     }
//                 } catch (e) { }

//                 try {
//                     if (obj[0].cedula[0][0].imgb4_3 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

//                     }
//                 } catch (e) { }
//                 try {
//                     if (obj[0].cedula[0][0].imgb4_4 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

//                     }
//                 } catch (e) { }

//                 doc.rect(30, 650, 500, 25).fillAndStroke('#ffffff');

//                 doc.fill('#661e2c').stroke();
//                 doc.fontSize(13);
//                 doc.text("NOTA: EXISTEN RIESGOS INTERNOS EN LA VIVIENDA POSIBLE APOYO POR CANCELAR",
//                     35, 655, { lineBreak: false });




//             } else {



//                 doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
//                     width: 500,
//                     align: 'center'
//                 });
//                 doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
//                     width: 500,
//                     align: 'center'
//                 });
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
//                 doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
//                 doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
//                 doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
//                 doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
//                     .moveDown();
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
//                     .moveDown();
//                 try {
//                     if (obj[0].cedula[0][0].imgb4_1 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

//                     }
//                 } catch (e) { }

//                 try {
//                     if (obj[0].cedula[0][0].imgb4_2 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

//                     }
//                 } catch (e) { }

//                 try {
//                     if (obj[0].cedula[0][0].imgb4_3 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

//                     }
//                 } catch (e) { }
//                 try {
//                     if (obj[0].cedula[0][0].imgb4_4 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

//                     }
//                 } catch (e) { }
//             }
//             doc.addPage();
//             let ahorros_F = 8
//             let ahorros_P = 80
//             if (obj[0].cedula[0][0].Cuenta_Ahorros.length >= 25) {

//                 ahorros_F = 6
//                 ahorros_P = 45
//             }
//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 5 "DATOS SOCIOECONÓMICOS DE LA VIVIENDA"`, 50, 75, {
//                 width: 500,
//                 align: 'center'
//             });
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso total mensual?", 50, 100, { align: "left" })
//             doc.fontSize(8).text("Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda?", 250, 100, { align: "left" })
//             doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso mensual familiar?", 50, 125, { align: "left" })
//             doc.fontSize(7).text("¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra?", 250, 125, { align: "left" })
//             doc.fontSize(8).text("¿Usted cuenta con cuentas de ahorro?", 50, 150, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualI, 100, 110, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Integrantes_Contribuyen, 400, 110, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualF, 100, 135, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Ayuda_Trabajos, 350, 133, { align: "left" })
//             doc.fontSize(ahorros_F).text(obj[0].cedula[0][0].Cuenta_Ahorros, ahorros_P, 160, { align: "left" })
//                 .moveDown();


//             if (obj[0].cedula[0][0].Cuenta_Ahorros == 'No cuenta con ninguna') {
//                 if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
//                     doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 50, 180, { align: "left" })
//                     doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 180, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 220, 160, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 80, 190, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 390, 190, { align: "left" })
//                         .moveDown();
//                     if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
//                         doc.fill('#b8925f').stroke();
//                         doc.fontSize(8).text("A quien pidio prestado", 50, 210, { align: "left" })
//                             .moveDown();
//                         doc.fill('#').stroke();
//                         doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 50, 220, { align: "left" })
//                     }
//                 } else {
//                     let FuenteCredito = 8;
//                     let PosCredito = 220;
//                     if (obj[0].cedula[0][0].Tarjetas_Credito.length >= 25) {
//                         FuenteCredito = 7;
//                         PosCredito = 200;
//                     }
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(FuenteCredito).text(obj[0].cedula[0][0].Tarjetas_Credito, PosCredito, 160, { align: "left" })
//                         .moveDown();
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 150, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 380, 160, { align: "left" })
//                         .moveDown();
//                     if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
//                         doc.fill('#b8925f').stroke();
//                         doc.fontSize(8).text("A quien pidio prestado", 50, 180, { align: "left" })
//                             .moveDown();
//                         doc.fill('#').stroke();
//                         doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 65, 190, { align: "left" })
//                     }


//                 }

//             } else {
//                 if (obj[0].cedula[0][0].cmbCuentaAhorros <= 6) {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Si tiene tarjeta de débito (de las señaladas en la pregunta anterior) generalmente, ¿cuántas veces al mes utiliza su tarjeta de débito para pagar compras en establecimientos comerciales, tiendas o restaurantes?", 240, 150, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Debito, 290, 168, { align: "left" })
//                         .moveDown();
//                     if (obj[0].cedula[0][0].nuevo_catalogo <= 2) {
//                         doc.fill('#b8925f').stroke();
//                         doc.fontSize(8).text("¿Cuál es la razón principal por la que no utiliza o casi no utiliza su tarjeta de débito para hacer compras o pagos?", 50, 185, { align: "left" })
//                             .moveDown();
//                         doc.fill('#').stroke();
//                         doc.fontSize(8).text(obj[0].cedula[0][0].Usa_DebitoMes, 50, 195, { align: "left" })
//                             .moveDown();
//                     }
//                     if (obj[0].cedula[0][0].usa_debito_mes == 10) {
//                         doc.fill('#b8925f').stroke();
//                         doc.fontSize(8).text("Especifique", 50, 210, { align: "left" })
//                             .moveDown();
//                         doc.fill('#').stroke();
//                         doc.fontSize(8).text(obj[0].cedula[0][0].txtUsaDebitoMes, 50, 220, { align: "left" })
//                             .moveDown();


//                     }
//                     if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
//                         doc.fill('#b8925f').stroke();
//                         doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 50, 220, { align: "left" })
//                         doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 200, 220, { align: "left" })
//                             .moveDown();
//                         doc.fill('#').stroke();
//                         doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 50, 230, { align: "left" })
//                         doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 250, 230, { align: "left" })
//                             .moveDown();
//                     }






//                 }

//             }

//             /*BLOQUE6*/




//             if (obj[0].integrantes == '[]') {
//                 doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
//                     width: 500,
//                     align: 'center'
//                 });

//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
//             } else {


//                 doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
//                     width: 500,
//                     align: 'center'
//                 });

//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
//                 try {
//                     if (obj[0].cedula[0][0].imgb6_1 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb6_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_1), 'base64'), 100, 280,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los Integrantes', 80, 270)

//                     }
//                 } catch (e) { }
//                 try {
//                     if (obj[0].cedula[0][0].imgb6_2 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb6_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_2), 'base64'), 350, 280,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los Integrantes', 340, 270)

//                     }
//                 } catch (e) { }

//                 try {
//                     if (obj[0].cedula[0][0].imgb6_3 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb6_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_3), 'base64'), 100, 480,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los Integrantes', 80, 470)

//                     }
//                 } catch (e) { }
//                 try {
//                     if (obj[0].cedula[0][0].imgb6_4 != "") {
//                         doc.image(new Buffer(obj[0].cedula[0][0].imgb_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_4), 'base64'), 350, 480,
//                             { width: 150, height: 150 });
//                         doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los Integrantes', 340, 470)

//                     }
//                 } catch (e) { }
//                 doc.addPage({ layout: 'landscape' })

//                 const table = {
//                     headers: ["id_unico", "Curp", "Nombre", "Edad integrante", "Genero", "Dependiente beneficirio", "Feje de hogar", "Madre soltera", "Derecho habiente", "Se considera indigena", "Contribuye ingreso", "Actividad economica", "A que se dedica", "Parentesco integrante", "Tiene discapacidad", "Problema discapacidad", "Causa dificultad", "Enfermedad degenerativa", "Grado estudios", "Estado vivian", "Es migranre", "Tipo migrante", "Tipo ingreso", "Qué tipo de ingresos"],
//                     rows: []
//                 };
//                 let patients = obj[0].integrantes
//                 //console.log("valio verga la vda",patients)
//                 for (const patient of patients) {
//                     table.rows.push([patient.id_unico, patient.curp_integrante, patient.nombre_integrante, patient.edad_integrante, patient.sex, patient.Dependiente_benefIntegrante, patient.Feje_hogarIntegrante, patient.MadreSolteraIntegrante, patient.DerechohabienteIteraIntegrante, patient.IndigenaI, patient.ContribuyeIngresoIteraIntegrante, patient.ActividadEconomicaI, patient.QuehaceIntegrante, patient.ParentescoIntegrante, patient.TieneDiscapacidadIntegrante, patient.ProblemaDiscapacidadIntegrante, patient.CausaDificultadIntegrante, patient.DegenerativaIntegrante, patient.GradoEstudiosIntegrante, patient.Estado_Vivían, patient.MigranteI, patient.TipoMigracionIntegrante, patient.TipoIngresosIntegrante, patient.txtTipoIngresosI])

//                 }



//                 doc.table(table, {
//                     x: 25,
//                     y: 130,
//                     columnSpacing: 10,
//                     padding: 1,
//                     columnsSize: [100, 100, 135],
//                     prepareHeader: () => doc.font("Times-Roman").fontSize(10).fillColor("#000000"),
//                     prepareRow: () => doc.font("Times-Roman").fontSize(5),

//                 });


//             }

//             doc.addPage();



//             doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 7 "CARACTERÍSTICAS DE LA VIVIENDA"`, 50, 60, {
//                 width: 500,
//                 align: 'center'
//             });
//             var matMuros = 8;
//             var pMuros = 50;
//             if (obj[0].cedula[0][0].MatMuros.length >= 20) {
//                 matMuros = 8;
//                 pMuros = 30;
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿Cuántas recámaras tiene la vivienda?", 50, 90, { align: "left" })
//             doc.fontSize(8).text("¿De qué material es el techo de la vivienda?", 220, 90, { align: "left" })
//             doc.fontSize(8).text("¿Con qué tipo de piso cuenta la vivienda?", 400, 90, { align: "left" })
//             doc.fontSize(8).text("¿De qué material son los muros de la vivienda?", 50, 110, { align: "left" })
//             doc.fontSize(8).text("¿La vivienda cuenta con escusado?", 250, 110, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Recamaras, 100, 100, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].MatTecho, 260, 100, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].MatPiso, 420, 100, { align: "left" })
//             doc.fontSize(matMuros).text(obj[0].cedula[0][0].MatMuros, pMuros, 118, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Escusado, 290, 120, { align: "left" })
//             if (obj[0].cedula[0][0].Escusado == 'NO') {
//                 let txtCocinarP = 240;
//                 let txtCocinarF = 8;
//                 let txtEscusadoP = 400
//                 let txtEscusadoF = 8
//                 let txtEscusadoU = 120
//                 if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
//                     txtCocinarP = 180
//                     txtCocinarF = 7
//                 }
//                 if (obj[0].cedula[0][0].txtEscusado.length >= 30) {
//                     txtEscusadoP = 380
//                     txtEscusadoF = 6
//                     txtEscusadoU = 117
//                 }
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("Que servicio ocupa", 400, 110, { align: "left" })
//                 doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 50, 140, { align: "left" })
//                 doc.fontSize(8).text("¿Cuenta con drenaje?", 190, 140, { align: "left" })
//                 doc.fontSize(8).text("¿Cuenta con agua potable?", 290, 140, { align: "left" })
//                 doc.fontSize(8).text("Frecuencia del servicio de agua potable", 400, 140, { align: "left" })
//                 doc.fill('#').stroke();
//                 doc.fontSize(txtEscusadoF).text(obj[0].cedula[0][0].txtEscusado, txtEscusadoP, 120, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 90, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 230, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 310, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 430, 150, { align: "left" })
//                 if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                     doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 220, 170, { align: "left" })
//                     doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 400, 170, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                     doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 450, 180, { align: "left" })
//                         .moveDown();
//                 } else {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                     doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
//                         //doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
//                         // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 178, { align: "left" })
//                         .moveDown();
//                 }
//                 if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 50, 200, { align: "left" })
//                     doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 280, 200, { align: "left" })
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 50, 210, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 310, 210, { align: "left" })
//                 } else {
//                     doc.fill('#b8925f').stroke();
//                     //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                     //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
//                     doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                     //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 180, { align: "left" })
//                         .moveDown();
//                 }




//             } else {
//                 let txtCocinarP = 50;
//                 let txtCocinarF = 8;
//                 if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
//                     txtCocinarP = 180
//                     txtCocinarF = 7
//                 }
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 400, 110, { align: "left" })
//                 doc.fontSize(8).text("¿Cuenta con drenaje?", 50, 140, { align: "left" })
//                 doc.fontSize(8).text("¿Cuenta con agua potable?", 150, 140, { align: "left" })
//                 doc.fontSize(8).text("Frecuencia del servicio de agua potable", 260, 140, { align: "left" })
//                 doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 400, 140, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 450, 120, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 80, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 190, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 310, 150, { align: "left" })
//                 doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 450, 150, { align: "left" })
//                     .moveDown();

//                 if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 50, 170, { align: "left" })
//                     doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 250, 170, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 300, 180, { align: "left" })
//                         .moveDown();
//                 } else {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 50, 170, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 80, 180, { align: "left" })
//                         .moveDown();
//                 }

//                 if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 280, 170, { align: "left" })
//                     doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
//                     doc.fill('#').stroke();
//                     doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 280, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
//                 } else {
//                     doc.fill('#b8925f').stroke();
//                     //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
//                     //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
//                     doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     // doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
//                     //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
//                     doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
//                         .moveDown();




//                 }


//                 if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {

//                     console.log("askdlhadadjhsjajskhadjskhadsjkhdjkh", obj[0].cedula[0][0].Trat_Basura)

//                     doc.fill('#b8925f').stroke();
//                     doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
//                         .moveDown();
//                     doc.fill('#').stroke();
//                     // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 250, 210, { align: "left" })
//                     // .moveDown();
//                 }


//             }
//             if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
//                 doc.fill('#b8925f').stroke();
//                 doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
//                     .moveDown();
//                 doc.fill('#').stroke();
//                 doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
//                     .moveDown();
//             }

//             try {
//                 if (obj[0].cedula[0][0].imgb7_1 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb7_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_1), 'base64'), 100, 250,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de las características de la vivienda', 80, 240)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb7_2 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb7_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_2), 'base64'), 350, 250,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de las características de la vivienda', 340, 240)

//                 }
//             } catch (e) { }

//             try {
//                 if (obj[0].cedula[0][0].imgb7_3 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb7_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_3), 'base64'), 100, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de las características de la vivienda', 80, 440)

//                 }
//             } catch (e) { }
//             try {
//                 if (obj[0].cedula[0][0].imgb7_4 != "") {
//                     doc.image(new Buffer(obj[0].cedula[0][0].imgb7_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_4), 'base64'), 350, 450,
//                         { width: 150, height: 150 });
//                     doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de las características de la vivienda', 340, 440)

//                 }
//             } catch (e) { }
//         }
//     }
//     if (obj[0].cedula[0][0].Tipo_Propiedad == 'Propia' && obj[0].cedula[0][0].Bloque == '3') {

//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
//         doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
//         doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
//         doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
//             , 300, 170, { align: "left" })
//             .moveDown();
//         doc.fill('#').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
//         doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
//             .moveDown();
//         if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
//             let Fonte = 7
//             let Adrss = 200
//             if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
//                 Fonte = 6
//                 Adrss = 180
//             }
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
//                 .moveDown();
//         }
//         if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
//         } else {
//             doc.fill('#b8925f').stroke();
//             doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
//             doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
//             doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
//                 .moveDown();
//             doc.fill('#').stroke();
//             doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
//             doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

//         }

//         doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
//             width: 500,
//             align: 'center'
//         });
//         try {
//             if (obj[0].cedula[0][0].imgb2_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb2_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_5 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_6 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
//                     { width: 150, height: 150 });
//                 doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

//             }
//         } catch (e) { }
//         doc.addPage();
//         try {
//             if (obj[0].cedula[0][0].imgb2_7 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_8 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb2_9 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgFirma != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

//             }
//         } catch (e) { }
//         doc.addPage();

//         //Bloque3
//         if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
//             obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_autopista == '') {
//             obj[0].cedula[0][0].Encuentra_autopista = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_tren == '') {
//             obj[0].cedula[0][0].Encuentra_tren = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_torres == '') {
//             obj[0].cedula[0][0].Encuentra_torres = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_ductos == '') {
//             obj[0].cedula[0][0].Encuentra_ductos = 'NO'
//         }
//         if (obj[0].cedula[0][0].Encuentra_rio == '') {
//             obj[0].cedula[0][0].Encuentra_rio = 'NO'
//         }
//         if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
//             obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
//         }
//         if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
//             obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
//         }
//         if (obj[0].cedula[0][0].Muros == '') {
//             obj[0].cedula[0][0].Muros = 'NO'
//         }
//         if (obj[0].cedula[0][0].Pisos == '') {
//             obj[0].cedula[0][0].Pisos = 'NO'
//         }
//         if (obj[0].cedula[0][0].Techo == '') {
//             obj[0].cedula[0][0].Techo = 'NO'
//         }
//         if (obj[0].cedula[0][0].Inclinacion == '') {
//             obj[0].cedula[0][0].Inclinacion = 'NO'
//         }
//         if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
//             obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
//         }

//         doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
//             width: 500,
//             align: 'center'
//         });
//         doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 80, {
//             width: 500,
//             align: 'center'
//         });
//         doc.fill('#').stroke();
//         doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
//         doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
//         doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
//         doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
//         doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
//         doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
//         doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
//         doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
//             .moveDown();
//         doc.fill('#b8925f').stroke();
//         doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
//         doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

//         try {
//             if (obj[0].cedula[0][0].imgb3_1 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb3_2 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

//             }
//         } catch (e) { }

//         try {
//             if (obj[0].cedula[0][0].imgb3_3 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

//             }
//         } catch (e) { }
//         try {
//             if (obj[0].cedula[0][0].imgb3_4 != "") {
//                 doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
//                     { width: 150, height: 150 });
//                 doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

//             }
//         } catch (e) { }


//         doc.rect(30, 650, 550, 25).fillAndStroke('#FFFFFF');

//         doc.fill('#661e2c').stroke();
//         doc.fontSize(12);
//         doc.text("NOTA: EXISTEN RIESGOS EN EL ENTORNO DE LA VIVIENDA POSIBLE APOYO A CANCELAR",
//             30, 655, { lineBreak: false });





//     }




// }
// function genera_pdf_pmv(obj, res) {
//     const PDFDocument = require("./pdfkit-tables");
//     const doc = new PDFDocument({ margin: 30, bufferPages: true });
//     res.writeHead(200, {

//         'Content-Type': 'application/pdf',
//         'Content-Disposition': 'attachment;  "attachment; filename=' + obj.id_unico + "_PMV.pdf"
//     });
//     pdfPmv(obj, doc);
//     doc.pipe(res);

//     doc.fontSize(12);
//     const range = doc.bufferedPageRange();
//     for (let i = range.start; i < (range.start + range.count); i++) {
//         doc.switchToPage(i);
//         doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/Villa.png", 10, 720,
//             { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
//                 { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento

//         doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/HEADER.png", 5, -10,
//             { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
//                 { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento





//     }

//     doc.end();
// };
// app.get('/api/get_pmv_c1/:id_unico', (req, res) => {
//     const id_unico = req.params.id_unico;
//     ObtenerIntegrantes(id_unico,
//         function (result) {
//             var id = result;
//             const sqlSelect = "call prod_pmv.sp_get_usPmv(?);";  //PRODUCCION            
//             db.query(sqlSelect, [id_unico], (err, result_) => {
//                 if (result == "") {

//                 } else { // res.send(result[0])
//                     let obj = [{ "cedula": result_, "integrantes": id }]
//                     genera_pdf_pmv(obj, res);
//                 }
//             });
//         });
// });
// function ObtenerIntegrantes(id_unico, callback) {
//     const sqlSelect = "call prod_pmv.sp_get_habitantes_c1(?)" //PRODUCCION 
//     db.query(sqlSelect, [id_unico], (err, result) => {
//         console.log("kasdj")
//         if (result[0] == '') {
//             return callback('[]')
//         } else {
//             return callback(result[0]);
//         }



//     });
// }

/*SOLVENTA*/
app.get('/api/get_pmv_solventa2022/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect = "call prod_pmv.sp_get_pmvSolventa(?)";
    // ejecurtar consulta
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err);
        if (result == "") {

        } else { // res.send(result[0])
            genera_solventa_2022(result, res);

        }
    });

})
function genera_solventa_2022(api, res) {

    // console.log("CONSOLE DE CURP",api[0].curp)
    size: [toPostscriptPoint(156), toPostscriptPoint(106)]
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {

        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;  filename=' + api[0][0].id_unico + "_solventa.pdf"
    });
    solventa_2022(api, doc);
    doc.pipe(res);
    doc.fontSize(12);
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);
        // doc.lineWidth(7);
        // doc.lineCap('round')
        //     .moveTo(50, 750)
        //     .lineTo(550, 750)
        //     .fillAndStroke("#b8925f")
        //     .stroke();
        doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/Villa.png", 10, 720,
            { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
                { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento

        doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/HEADER.png", 5, -10,
            { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
                { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento
    }

    doc.end();
}
function solventa_2022(api, doc) {

    if (api[0][0].Pintura == '0') {
        api[0][0].Pintura = 'NO'
    } else {
        api[0][0].Pintura = 'SI'
    }
    if (api[0][0].Puertas == '0') {
        api[0][0].Puertas = 'NO'
    } else {
        api[0][0].Puertas = 'SI'
    }
    if (api[0][0].Impermeabilizacion == '0') {
        api[0][0].Impermeabilizacion = 'NO'
    } else {
        api[0][0].Impermeabilizacion = 'SI'
    }
    if (api[0][0].electrica == '0') {
        api[0][0].electrica = 'NO'
    } else {
        api[0][0].electrica = 'SI'
    }
    if (api[0][0].hidraulica == '0') {
        api[0][0].hidraulica = 'NO'
    } else {
        api[0][0].hidraulica = 'SI'
    }
    if (api[0][0].Ecotecnias == '0') {
        api[0][0].Ecotecnias = 'NO'
    } else {
        api[0][0].Ecotecnias = 'SI'
    }
    if (api[0][0].Fosa == '0') {
        api[0][0].Fosa = 'NO'
    } else {
        api[0][0].Fosa = 'SI'
    }
    if (api[0][0].Exteriores == '0') {
        api[0][0].Exteriores = 'NO'
    } else {
        api[0][0].Exteriores = 'SI'
    }
    if (api[0][0].Techo == '0') {
        api[0][0].Techo = 'NO'
    } else {
        api[0][0].Techo = 'SI'
    }
    if (api[0][0].Muros == '0') {
        api[0][0].Muros = 'NO'
    } else {
        api[0][0].Muros = 'SI'
    }
    if (api[0][0].Firme == '0') {
        api[0][0].Firme = 'NO'
    } else {
        api[0][0].Firme = 'SI'
    }
    if (api[0][0].Cuarto == '0') {
        api[0][0].Cuarto = 'NO'
    } else {
        api[0][0].Cuarto = 'SI'
    }
    if (api[0][0].Bano == '0') {
        api[0][0].Bano = 'NO'
    } else {
        api[0][0].Bano = 'SI'
    }
    if (api[0][0].Cocina == '0') {
        api[0][0].Cocina = 'NO'
    } else {
        api[0][0].Cocina = 'SI'
    }
    if (api[0][0].Estructurales == '0') {
        api[0][0].Estructurales = 'NO'
    } else {
        api[0][0].Estructurales = 'SI'
    }
    if (api[0][0].Terminacion == '0') {
        api[0][0].Terminacion = 'NO'
    } else {
        api[0][0].Terminacion = 'SI'
    }
    if (api[0][0].Cuenta_ayude_trabajos == '0') {
        api[0][0].Cuenta_ayude_trabajos = 'NO'
    } else {
        api[0][0].Cuenta_ayude_trabajos = 'SI'
    }
    if (api[0][0].Beneficiario_aporto == '0') {
        api[0][0].Beneficiario_aporto = 'NO'
    } else {
        api[0][0].Beneficiario_aporto = 'SI'
    }

    doc.font("Times-Bold").fontSize(25).fillColor('#661e2c').text(`ENTREGA APOYOS`, 35, 80, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 115, {
        width: 500,
        align: 'center'
    });
    let col1LeftPos = 70;
    let colTop = 150;
    let colWidth = 120;
    let col2LeftPos = colWidth + col1LeftPos + 40;
    let col3LeftPos = colWidth + col2LeftPos + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('NOMBRE\n\n' + api[0][0].Nombre, col1LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('PRIMER APELLIDO\n\n' + api[0][0].Primer_apellido, col2LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    }).text('SEGUNDO APELLIDO\n\n' + api[0][0].Segundo_apellido_ine, col3LeftPos, colTop, {
        width: colWidth,
        align: 'center'
    });
    let col1LeftPos1 = 70;
    let colTop1 = 200;
    let colWidth1 = 120;
    let col2LeftPos1 = colWidth1 + col1LeftPos1 + 40;
    let col3LeftPos1 = colWidth1 + col2LeftPos1 + 40;
    doc.font("Times-Bold").fontSize(9).fillColor('#').text('CURP\n\n' + api[0][0].curp, col1LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    }).text('ID_UNICO\n\n' + api[0][0].id_unico, col2LeftPos1, colTop1, {
        width: colWidth1,
        align: 'center'
    });
    let col1LeftPos2 = 70;
    let colTop2 = 245;
    let colWidth2 = 120;
    // doc.font("Times-Bold").fontSize(9).fillColor('#').text('SEGUNDO APELLIDO (INE)\n\n' + api[0].Segundo_apellido_ine, col1LeftPos2, colTop2, {
    //     width: colWidth2,
    //     align: 'center'
    // });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`FICHA DIAGNÓSTICA`, 35, 270, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿Qué linea de apoyo tiene la persona beneficiaria?`, 35, 280, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text(api[0][0].Tipo_apoyo_CONAVI, 35, 295, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text('¿En qué utilizó su apoyo de Mejoramiento o Ampliación?', 35, 310, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('A) Pintura, Aplanados o colacioón de loseta en muros : ' + api[0][0].Pintura, 70, 340, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('B) Puertas y ventanas : ' + api[0][0].Puertas, 70, 350, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('C) Impermeabilización : ' + api[0][0].Impermeabilizacion, 70, 360, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('D) Instalacion Electrica : ' + api[0][0].electrica, 70, 370, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('E) Instalacion hidráulica y sanitaria : ' + api[0][0].hidraulica, 70, 380, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('F) Ecotecnias: Paneles solares, biodigestor, calentador solar, captacion de agua pluvial, etc : ' + api[0][0].Ecotecnias, 70, 390, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('G) Fosa séptica : ' + api[0][0].Fosa, 70, 400, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('h) Exteriores: bardas, firmes, techado, etc. : ' + api[0][0].Exteriores, 70, 410, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('I) Construcción de techo: ' + api[0][0].Techo, 70, 420, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('J) Construcción de muros: ' + api[0][0].Muros, 70, 430, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('K) Construcción firme y/o colacación de loseta: ' + api[0][0].Firme, 70, 440, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('L) Construcción de cuarto: ' + api[0][0].Cuarto, 70, 450, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('M) Construcción de baño: ' + api[0][0].Bano, 70, 460, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('N) Construcción de cocina: ' + api[0][0].Cocina, 70, 470, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('O) Construcción de elementos estructurales: cimentación, muros, columnas, trabes o techo: ' + api[0][0].Estructurales, 70, 480, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text('P) Terminación de la vivienda en obra negra: ' + api[0][0].Terminacion, 70, 490, {
        width: 500,
        align: 'left'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿Cuenta con quien le ayude para la realización de los trabajos?`, 70, 520, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text(api[0][0].Cuenta_ayude_trabajos, 70, 535, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`¿El beneficiario aporto alguna dinero?`, 70, 550, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#').text(api[0][0].Beneficiario_aporto + ' ' + api[0][0].Cantidad_aporto, 70, 570, {
        width: 500,
        align: 'center'
    });

    try {
        if (api[0][0].imgEvidencia_entrega != "") {
            doc.image(new Buffer(api[0][0].imgEvidencia_entrega.replace('data:image/png;base64,', api[0][0].imgEvidencia_entrega), 'base64'),
                { width: 150, height: 150 });
        }
    } catch (e) { }
    try {
        if (api[0][0].imgEvidencia_carta != "") {
            doc.image(new Buffer(api[0][0].imgEvidencia_carta.replace('data:image/png;base64,', api[0][0].imgEvidencia_carta), 'base64'), 380, 585,

                { width: 150, height: 150 });
        }
    } catch (e) { }

}




function ObtenerPermisoPmv(email, callback) {
    const sqlSelect = "SELECT id,cnfg_edo,email FROM prod_adms.cnfg_permisos where id_modulo= 704 and email = ?;" //PRODUCCION   
    db.query(sqlSelect, [email], (err, result) => {
        console.log(err)
        return callback(result[0].cnfg_edo);
    });
}
app.get('/api/get_pmv_tabla/:usuario', (req, res) => {


    const usuario = req.params.usuario;
    ObtenerPermisoPmv(usuario,
        function (result) {
            edos = result;
            console.log(edos)
            const sqlSelect = "SELECT c1.id_unico,txtCURP as curp,bloque,CONCAT(txtNombre,' ',txtPrimer_apellido, ' ',txtSegundo_apellido) AS Nombre,concat(txtCalle,' N° ',txtNum_int,' N.EXT ',txtNum_ext,' ',txtColonia,' ',txtCp,' ',IFNULL(l.nombre_localidad, ' '),', ',ce.nombre_estado ) as domicilio,concat('<i id=\"',c1.id_unico,'\"class=\"fas fa-caret-square-up\"></i>') as hola_ FROM prod_pmv.pmv_captura_c1 c1 LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = c1.cmbClave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = c1.cmbClave_estado AND mn.id_municipio = c1.cmbClave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = c1.cmbClave_localidad AND l.id_municipio = c1.cmbClave_municipio AND l.id_estado = c1.cmbClave_estado WHERE c1.cve_bajal = 'A' and c1.cmbClave_estado in(" + edos + ");";
            db.query(sqlSelect, (err, result) => {
                console.log(err)
                res.send(result);
            });

        });


});








/*nuevas apis pmv solventa*/

app.get('/api/get_img_solventaS/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect = "SELECT  \n"
        + "id_unico, \n"
        + "TO_BASE64(imgEvidencia_carta) AS imgEvidencia_cartaD, \n"
        + "TO_BASE64(imgEvidencia_entrega) AS imgEvidencia_entregaD, \n"
        + "CONCAT(curp,'imgEvidencia_carta_',id_unico,'.jpg') AS imgEvidencia_carta_, \n"
        + "CONCAT(curp,'imgEvidencia_entrega_',id_unico,'.jpg') AS imgEvidencia_entrega_ \n"
        + "FROM \n"
        + "prod_pmv.pmv_solventa \n"
        + "WHERE \n"
        + "id_unico = ?"
    db.query(sqlSelect, [id_unico], (err, result) => {
        console.log(err)
        res.send(result[0]);
    });
});





app.get('/api/get_pmv_c1_tabla', (req, res) => {
    const sqlSelect = "SELECT * FROM prod_adms.pmv_impresion_sincomite where cve_bajal = 'A'";
    db.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
        // console.log(result)
    });

})
function pdfPmv(obj, doc) {




    doc.font("Times-Bold").fontSize(13).fillColor('#661e2c').text(`VISITA DE IDENTIFICACIÓN DE PERSONAS BENEFICIARIAS CUESTIONARIO 1 (C1)`, 35, 60, {
        width: 500,
        align: 'center'
    });
    doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`DATOS DEL BENEFICIARIO`, 35, 100, {
        width: 500,
        align: 'center'
    });

    if (obj[0].cedula[0][0].txtDificultadDiscapacidad == null) {
        if (obj[0].cedula[0][0].txtDificultadDiscapacidad == 'NO') {
            var problema = 'Salud'
        } else {
            problema = 'Nacimiento'
        }
    }
    if (obj[0].cedula[0][0].Derechohabiente == 'SI') {
        doc.fill('#b8925f').stroke()
        doc.fontSize(8)
            .text("Que tipo de servicio", 170, 200, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8)
            .text(obj[0].cedula[0][0].DescripcionDerechohabiente, 170, 210, { align: "left" })
            .moveDown();
    } else {
        let fZiceT = 8
        let moveLeft = 175
        if (obj[0].cedula[0][0].txtDerechohabiente.length == 15) {
            fZiceT = 7
            moveLeft = 150
        }
        doc.fill('#b8925f').stroke()
        doc.fontSize(8)
            .text("Que tipo de servicio", 170, 210, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(fZiceT)
            .text(obj[0].cedula[0][0].txtDerechohabiente, moveLeft, 220, { align: "left" })
            .moveDown();
    }
    if (obj[0].cedula[0][0].Tiene_Discapacidad == 'NO') {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8)
            .text("¿Es una persona con discapacidad?", 450, 210, { align: "left" })
            .text("¿Cuál es su último grado de estudios?", 50, 230, { align: "left" })
            .text("¿Hace 5 años en qué estado de la República Mexicana o país vivían?", 200, 230, { align: "left" })
            .text("¿Migra constantemente?", 450, 230, { align: "left" })
            .text("¿Recibe ingresos por?", 50, 260, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8)
            .text(obj[0].cedula[0][0].Tiene_Discapacidad, 500, 220, { align: "left" })
            .text(obj[0].cedula[0][0].Grado_Estudios, 80, 240, { align: "left" })
            .text(obj[0].cedula[0][0].Estado_Vivían, 300, 240, { align: "left" })
            .text(obj[0].cedula[0][0].Migrante, 480, 240, { align: "left" })
            .text(obj[0].cedula[0][0].Tipo_Ingresos, 55, 270, { align: "left" })
        if (obj[0].cedula[0][0].Tipo_Ingresos == 'Otro') {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8)
                .text("Ingresos por", 150, 260, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8)
                .text(obj[0].cedula[0][0].txtTipoIngresos, 145, 270, { align: "left" })
                .moveDown();
        }
    } else {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8)
            .text("¿Es una persona con discapacidad?", 450, 200, { align: "left" })
            .text("¿La discapacidad que presenta es por un problema de? ", 50, 230, { align: "left" })
            .text("¿Es una dificultad para?", 280, 230, { align: "left" })
            .text("La dificultad es por: ", 430, 230, { align: "left" })
            .text("¿Tiene enfermedad degenerativa? ", 50, 260, { align: "left" })
            .text("¿Cuál es su último grado de estudios?", 220, 260, { align: "left" })
            .text("¿Hace 5 años en qué estado de la República Mexicana o país vivían?", 380, 260, { align: "left" })
            .text("¿Migra constantemente?", 50, 290, { align: "left" })
            .text("¿Recibe ingresos por?", 200, 290, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8)
            .text(obj[0].cedula[0][0].Tiene_Discapacidad, 500, 210, { align: "left" }) // 
            .text(problema, 90, 240, { align: "left" })
            .text(obj[0].cedula[0][0].txtDificultadDiscapacidad, 250, 240, { align: "left" })
            .text(obj[0].cedula[0][0].Causa_Dificultad, 440, 240, { align: "left" })
            .text(obj[0].cedula[0][0].Degenerativa, 100, 270, { align: "left" })
            .text(obj[0].cedula[0][0].Grado_Estudios, 260, 270, { align: "left" })
            .text(obj[0].cedula[0][0].Estado_Vivían, 450, 270, { align: "left" })
            .text(obj[0].cedula[0][0].Migrante, 90, 300, { align: "left" })
            .text(obj[0].cedula[0][0].Tipo_Ingresos, 200, 300, { align: "left" })
            .moveDown();
    }
    if (obj[0].cedula[0][0].Actividad_Economica == 'Otro') {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8)
            .text("CURP de la persona solicitante:", 50, 120, { align: "left" })
            .text("Nombre de la persona solicitante:", 220, 120, { align: "left" })
            .text("Género:", 390, 120, { align: "left" })
            .text("Fecha de nacimiento de la persona solicitante ", 450, 120, { align: "left" })
            .text("Tipo de identificación oficial vigente", 50, 150, { align: "left" })
            .text("No. de identificación oficial vigente", 200, 150, { align: "left" })
            .text("Actividad económica ", 350, 150, { align: "left" })
            .text("Tipo de actividad economica", 460, 150, { align: "left" })
            .text("Medios de contacto", 70, 180, { align: "left" })
            .text("¿Es jefe/jefa de hogar? ", 180, 180, { align: "left" })
            .text("¿Se considera indígena?", 310, 180, { align: "left" })
            .text("¿Es madre soltera? ", 430, 180, { align: "left" })
            .text("¿Es derechohabiente?  ", 50, 210, { align: "left" })
            .text("¿Contribuye al ingreso familiar? ", 320, 210, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8)
            .text(obj[0].cedula[0][0].txtCURP, 60, 130, { align: "left" })
            .text(obj[0].cedula[0][0].nombre, 200, 130, { align: "left" })
            .text(obj[0].cedula[0][0].genero, 390, 130, { align: "left" })
            .text(obj[0].cedula[0][0].txtFecha_nacimiento, 500, 130, { align: "left" })
            .text(obj[0].cedula[0][0].Tipo_Identificacion, 55, 160, { align: "left" })
            .text(obj[0].cedula[0][0].txtId, 230, 160, { align: "left" })
            .text(obj[0].cedula[0][0].Actividad_Economica, 370, 160, { align: "left" })
            .text(obj[0].cedula[0][0].txtActividadEconomica, 480, 160, { align: "left" })
            .text(obj[0].cedula[0][0].txtTelefono + ' y ' + obj[0].cedula[0][0].txtTelefono_alterno, 60, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Jefe_Hogar, 210, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Indigena, 340, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Madre_Soltera, 450, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Derechohabiente, 80, 220, { align: "left" }) //
            .text(obj[0].cedula[0][0].Contribuye_Ingreso, 370, 220, { align: "left" })
            .moveDown();
    } else {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8)
            .text("CURP de la persona solicitante:", 50, 120, { align: "left" })
            .text("Nombre de la persona solicitante:", 220, 120, { align: "left" })
            .text("Género:", 390, 120, { align: "left" })
            .text("Fecha de nacimiento de la persona solicitante ", 450, 120, { align: "left" })
            .text("Tipo de identificación oficial vigente", 50, 150, { align: "left" })
            .text("No. de identificación oficial vigente", 200, 150, { align: "left" })
            .text("Actividad económica ", 400, 150, { align: "left" })
            .text("Medios de contacto", 70, 180, { align: "left" })
            .text("¿Es jefe/jefa de hogar? ", 180, 180, { align: "left" })
            .text("¿Se considera indígena?", 310, 180, { align: "left" })
            .text("¿Es madre soltera? ", 430, 180, { align: "left" })
            .text("¿Es derechohabiente?  ", 70, 210, { align: "left" })
            .text("¿Contribuye al ingreso familiar? ", 270, 210, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8)
            .text(obj[0].cedula[0][0].txtCURP, 60, 130, { align: "left" })
            .text(obj[0].cedula[0][0].nombre, 200, 130, { align: "left" })
            .text(obj[0].cedula[0][0].genero, 390, 130, { align: "left" })
            .text(obj[0].cedula[0][0].txtFecha_nacimiento, 500, 130, { align: "left" })
            .text(obj[0].cedula[0][0].Tipo_Identificacion, 55, 160, { align: "left" })
            .text(obj[0].cedula[0][0].txtId, 230, 160, { align: "left" })
            .text(obj[0].cedula[0][0].Actividad_Economica, 410, 160, { align: "left" })
            .text(obj[0].cedula[0][0].txtTelefono + ' y ' + obj[0].cedula[0][0].txtTelefono_alterno, 60, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Jefe_Hogar, 210, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Indigena, 340, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Madre_Soltera, 450, 190, { align: "left" })
            .text(obj[0].cedula[0][0].Derechohabiente, 100, 220, { align: "left" }) //dd
            .text(obj[0].cedula[0][0].Contribuye_Ingreso, 320, 220, { align: "left" })
            .moveDown();
    }


    doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Fotografias Documentos solicitante`, 35, 320, {
        width: 500,
        align: 'center'
    });
    // IMAGEN 1
    try {
        if (obj[0].cedula[0][0].imgb1_1 != "") {
            doc.image(new Buffer(obj[0].cedula[0][0].imgb1_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_1), 'base64'), 50, 370,
                { width: 150, height: 150 });
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Anverso de la CURP del solicitante', 65, 360)

        }
    } catch (e) { }
    try {
        if (obj[0].cedula[0][0].imgb1_3 != "") {
            doc.image(new Buffer(obj[0].cedula[0][0].imgb1_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_3), 'base64'), 230, 370,
                { width: 150, height: 150 });
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Anverso de la INE del solicitante', 250, 360)

        }
    } catch (e) { }
    try {
        if (obj[0].cedula[0][0].imgb1_4 != "") {
            doc.image(new Buffer(obj[0].cedula[0][0].imgb1_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb1_4), 'base64'), 410, 370,
                { width: 150, height: 150 });
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Reverso de la INE del solicitante', 430, 360)
        }
    } catch (e) { }
    doc.addPage();
    // Bloque 2

    doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 2 "DOMICILIO DE LA VIVIENDA"`, 35, 60, {
        width: 500,
        align: 'center'
    });
    doc.fill('#b8925f').stroke();
    doc.fontSize(8).text("Entidad", 50, 80, { align: "left" })
    doc.fontSize(8).text("Municipio", 150, 80, { align: "left" })
    doc.fontSize(8).text("Localidad", 250, 80, { align: "left" })
    doc.fontSize(8).text("Código Postal", 430, 80, { align: "left" })
    doc.fontSize(8).text("Dirección (Calle, número, colonia)", 50, 110, { align: "left" })
    doc.fontSize(8).text("Tipo de propiedad o posesión de la vivienda", 250, 110, { align: "left" })
    doc.fontSize(8).text("La persona solicitante, ¿es la propietaria de la vivienda?", 400, 110, { align: "center" })
        .moveDown();
    var FuenteMunicipio = 8;
    var Pmunicipio = 150;
    if (obj[0].cedula[0][0].Nombre_municipio.length >= 20) {
        FuenteMunicipio = 6;
        Pmunicipio = 130;
    }
    var Pdomicilio = 50;
    let FDomicilio = 8;
    let fontLocalidad = 8
    var Plocalidad = 240;
    if (obj[0].cedula[0][0].Nombre_localidad.length >= 25) {
        fontLocalidad = 8
        Plocalidad = 210;
    }
    console.log("palabrs dentro del municipio", obj[0].cedula[0][0].domicilio.length)

    if (obj[0].cedula[0][0].domicilio.length >= 30) {
        Pdomicilio = 40
        FDomicilio = 7

    }
    doc.fill('#').stroke();
    doc.fontSize(8).text(obj[0].cedula[0][0].Nombre_estado, 50, 90, { align: "left" })
    doc.fontSize(FuenteMunicipio).text(obj[0].cedula[0][0].Nombre_municipio, Pmunicipio, 90, { align: "left" })
    doc.fontSize(fontLocalidad).text(obj[0].cedula[0][0].Nombre_localidad, Plocalidad, 90, { align: "left" })
    doc.fontSize(8).text(obj[0].cedula[0][0].txtCp, 440, 90, { align: "left" })
    doc.fontSize(FDomicilio).text(obj[0].cedula[0][0].domicilio, Pdomicilio, 120, { align: "left" })
    doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Propiedad, 300, 120, { align: "left" })
    doc.fontSize(8).text(obj[0].cedula[0][0].EsPropietario, 515, 120, { align: "left" })
        .moveDown();



    if (obj[0].cedula[0][0].Tipo_Propiedad == 'Propia' && obj[0].cedula[0][0].Bloque != '3') {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
        doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
        doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
        doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
            , 300, 170, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
        doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
            .moveDown();
        if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
            let Fonte = 7
            let Adrss = 200
            if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
                Fonte = 6
                Adrss = 180
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
                .moveDown();
        }
        if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
        } else {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
            doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

        }

        doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
            width: 500,
            align: 'center'
        });
        try {
            if (obj[0].cedula[0][0].imgb2_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_5 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_6 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

            }
        } catch (e) { }
        doc.addPage();
        try {
            if (obj[0].cedula[0][0].imgb2_7 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_8 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_9 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgFirma != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

            }
        } catch (e) { }
        doc.addPage();

        //Bloque3
        if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
            obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_autopista == '') {
            obj[0].cedula[0][0].Encuentra_autopista = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_tren == '') {
            obj[0].cedula[0][0].Encuentra_tren = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_torres == '') {
            obj[0].cedula[0][0].Encuentra_torres = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_ductos == '') {
            obj[0].cedula[0][0].Encuentra_ductos = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_rio == '') {
            obj[0].cedula[0][0].Encuentra_rio = 'NO'
        }
        if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
            obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
        }
        if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
            obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
        }
        if (obj[0].cedula[0][0].Muros == '') {
            obj[0].cedula[0][0].Muros = 'NO'
        }
        if (obj[0].cedula[0][0].Pisos == '') {
            obj[0].cedula[0][0].Pisos = 'NO'
        }
        if (obj[0].cedula[0][0].Techo == '') {
            obj[0].cedula[0][0].Techo = 'NO'
        }
        if (obj[0].cedula[0][0].Inclinacion == '') {
            obj[0].cedula[0][0].Inclinacion = 'NO'
        }
        if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
            obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
        }




        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 85, {
            width: 500,
            align: 'center'
        });
        doc.fill('#').stroke();
        doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
        doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
        doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
        doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
        doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
        doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
        doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
        doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
            .moveDown();
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

        try {
            if (obj[0].cedula[0][0].imgb3_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb3_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb3_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb3_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

            }
        } catch (e) { }
        doc.addPage();

        //Bloque4


        if (obj[0].cedula[0][0].Muros == 'SI' || obj[0].cedula[0][0].Pisos == 'SI' || obj[0].cedula[0][0].Techo == 'SI' || obj[0].cedula[0][0].Inclinacion == 'SI') {
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
                width: 500,
                align: 'center'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 10, 80, {
                width: 600,
                align: 'center'
            });
            doc.fill('#').stroke();
            doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
            doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
            doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
            doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
            doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
                .moveDown();
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
                .moveDown();
            try {
                if (obj[0].cedula[0][0].imgb4_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb4_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb4_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb4_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

                }
            } catch (e) { }

            doc.rect(30, 650, 500, 25).fillAndStroke('#ffffff');

            doc.fill('#661e2c').stroke();
            doc.fontSize(13);
            doc.text("NOTA: EXISTEN RIESGOS INTERNOS EN LA VIVIENDA POSIBLE APOYO POR CANCELAR",
                35, 655, { lineBreak: false });




        } else {



            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
                width: 500,
                align: 'center'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
                width: 500,
                align: 'center'
            });
            doc.fill('#').stroke();
            doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
            doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
            doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
            doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
            doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
                .moveDown();
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
                .moveDown();
            try {
                if (obj[0].cedula[0][0].imgb4_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb4_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb4_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb4_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

                }
            } catch (e) { }
        }
        doc.addPage();
        let ahorros_F = 8
        let ahorros_P = 80
        if (obj[0].cedula[0][0].Cuenta_Ahorros.length >= 25) {

            ahorros_F = 6
            ahorros_P = 45
        }
        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 5 "DATOS SOCIOECONÓMICOS DE LA VIVIENDA"`, 50, 75, {
            width: 500,
            align: 'center'
        });
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso total mensual?", 50, 100, { align: "left" })
        doc.fontSize(8).text("Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda?", 250, 100, { align: "left" })
        doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso mensual familiar?", 50, 125, { align: "left" })
        doc.fontSize(7).text("¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra?", 250, 125, { align: "left" })
        doc.fontSize(8).text("¿Usted cuenta con cuentas de ahorro?", 50, 150, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualI, 100, 110, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Integrantes_Contribuyen, 400, 110, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualF, 100, 135, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Ayuda_Trabajos, 350, 133, { align: "left" })
        doc.fontSize(ahorros_F).text(obj[0].cedula[0][0].Cuenta_Ahorros, ahorros_P, 160, { align: "left" })
            .moveDown();


        if (obj[0].cedula[0][0].Cuenta_Ahorros == 'No cuenta con ninguna') {
            if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
                doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 50, 180, { align: "left" })
                doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 180, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 220, 160, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 80, 190, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 390, 190, { align: "left" })
                    .moveDown();
                if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("A quien pidio prestado", 50, 210, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 50, 220, { align: "left" })
                }
            } else {
                let FuenteCredito = 8;
                let PosCredito = 220;
                if (obj[0].cedula[0][0].Tarjetas_Credito.length >= 25) {
                    FuenteCredito = 7;
                    PosCredito = 200;
                }
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(FuenteCredito).text(obj[0].cedula[0][0].Tarjetas_Credito, PosCredito, 160, { align: "left" })
                    .moveDown();
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 150, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 380, 160, { align: "left" })
                    .moveDown();
                if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("A quien pidio prestado", 50, 180, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 65, 190, { align: "left" })
                }


            }

        } else {
            if (obj[0].cedula[0][0].cmbCuentaAhorros <= 6) {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Si tiene tarjeta de débito (de las señaladas en la pregunta anterior) generalmente, ¿cuántas veces al mes utiliza su tarjeta de débito para pagar compras en establecimientos comerciales, tiendas o restaurantes?", 240, 150, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Debito, 290, 168, { align: "left" })
                    .moveDown();
                if (obj[0].cedula[0][0].nuevo_catalogo <= 2) {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿Cuál es la razón principal por la que no utiliza o casi no utiliza su tarjeta de débito para hacer compras o pagos?", 50, 185, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Usa_DebitoMes, 50, 195, { align: "left" })
                        .moveDown();
                }
                if (obj[0].cedula[0][0].usa_debito_mes == 10) {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Especifique", 50, 210, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].txtUsaDebitoMes, 50, 220, { align: "left" })
                        .moveDown();


                }
                if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 50, 220, { align: "left" })
                    doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 200, 220, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 50, 230, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 250, 230, { align: "left" })
                        .moveDown();
                }






            }

        }






        /*BLOQUE6*/

        if (obj[0].integrantes == '[]') {
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
                width: 500,
                align: 'center'
            });

            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
        } else {


            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
                width: 500,
                align: 'center'
            });

            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
            try {
                if (obj[0].cedula[0][0].imgb6_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb6_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_1), 'base64'), 100, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los Integrantes', 80, 270)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb6_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb6_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_2), 'base64'), 350, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los Integrantes', 340, 270)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb6_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb6_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_3), 'base64'), 100, 480,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los Integrantes', 80, 470)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb6_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_4), 'base64'), 350, 480,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los Integrantes', 340, 470)

                }
            } catch (e) { }
            doc.addPage({ layout: 'landscape' })

            const table = {
                headers: ["id_unico", "Curp", "Nombre", "Edad integrante", "Genero", "Dependiente beneficirio", "Feje de hogar", "Madre soltera", "Derecho habiente", "Se considera indigena", "Contribuye ingreso", "Actividad economica", "A que se dedica", "Parentesco integrante", "Tiene discapacidad", "Problema discapacidad", "Causa dificultad", "Enfermedad degenerativa", "Grado estudios", "Estado vivian", "Es migranre", "Tipo migrante", "Tipo ingreso", "Qué tipo de ingresos"],
                rows: []
            };
            let patients = obj[0].integrantes
            for (const patient of patients) {
                table.rows.push([patient.id_unico, patient.curp_integrante, patient.nombre_integrante, patient.edad_integrante, patient.sex, patient.Dependiente_benefIntegrante, patient.Feje_hogarIntegrante, patient.MadreSolteraIntegrante, patient.DerechohabienteIteraIntegrante, patient.IndigenaI, patient.ContribuyeIngresoIteraIntegrante, patient.ActividadEconomicaI, patient.QuehaceIntegrante, patient.ParentescoIntegrante, patient.TieneDiscapacidadIntegrante, patient.ProblemaDiscapacidadIntegrante, patient.CausaDificultadIntegrante, patient.DegenerativaIntegrante, patient.GradoEstudiosIntegrante, patient.Estado_Vivían, patient.MigranteI, patient.TipoMigracionIntegrante, patient.TipoIngresosIntegrante, patient.txtTipoIngresosI])

            }
            doc.table(table, {
                x: 25,
                y: 130,
                columnSpacing: 5,
                padding: 1,
                columnsSize: [100, 100, 135],
                prepareHeader: () => doc.font("Times-Roman").fontSize(10).fillColor("#000000"),
                prepareRow: () => doc.font("Times-Roman").fontSize(5),

            });

        }
        doc.addPage();

        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 7 "CARACTERÍSTICAS DE LA VIVIENDA"`, 50, 60, {
            width: 500,
            align: 'center'
        });
        var matMuros = 8;
        var pMuros = 50;
        if (obj[0].cedula[0][0].MatMuros.length >= 20) {
            matMuros = 8;
            pMuros = 30;
        }
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text("¿Cuántas recámaras tiene la vivienda?", 50, 90, { align: "left" })
        doc.fontSize(8).text("¿De qué material es el techo de la vivienda?", 220, 90, { align: "left" })
        doc.fontSize(8).text("¿Con qué tipo de piso cuenta la vivienda?", 400, 90, { align: "left" })
        doc.fontSize(8).text("¿De qué material son los muros de la vivienda?", 50, 110, { align: "left" })
        doc.fontSize(8).text("¿La vivienda cuenta con escusado?", 250, 110, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Recamaras, 100, 100, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].MatTecho, 260, 100, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].MatPiso, 420, 100, { align: "left" })
        doc.fontSize(matMuros).text(obj[0].cedula[0][0].MatMuros, pMuros, 118, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Escusado, 290, 120, { align: "left" })
        if (obj[0].cedula[0][0].Escusado == 'NO') {
            let txtCocinarP = 240;
            let txtCocinarF = 8;
            let txtEscusadoP = 400
            let txtEscusadoF = 8
            let txtEscusadoU = 120
            if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
                txtCocinarP = 180
                txtCocinarF = 7
            }
            if (obj[0].cedula[0][0].txtEscusado.length >= 30) {
                txtEscusadoP = 380
                txtEscusadoF = 6
                txtEscusadoU = 117
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Que servicio ocupa", 400, 110, { align: "left" })
            doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 50, 140, { align: "left" })
            doc.fontSize(8).text("¿Cuenta con drenaje?", 190, 140, { align: "left" })
            doc.fontSize(8).text("¿Cuenta con agua potable?", 290, 140, { align: "left" })
            doc.fontSize(8).text("Frecuencia del servicio de agua potable", 400, 140, { align: "left" })
            doc.fill('#').stroke();
            doc.fontSize(txtEscusadoF).text(obj[0].cedula[0][0].txtEscusado, txtEscusadoP, 120, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 90, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 230, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 310, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 430, 150, { align: "left" })
            if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 220, 170, { align: "left" })
                    // doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 400, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
                    //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 450, 180, { align: "left" })
                    .moveDown();
            } else {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
                    //doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
                    // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 178, { align: "left" })
                    .moveDown();
            }
            if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 50, 200, { align: "left" })
                doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 280, 200, { align: "left" })
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 50, 210, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 310, 210, { align: "left" })
            } else {
                doc.fill('#b8925f').stroke();
                //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
                doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 180, { align: "left" })
                    .moveDown();
            }




        } else {
            let txtCocinarP = 50;
            let txtCocinarF = 8;
            if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
                txtCocinarP = 180
                txtCocinarF = 7
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 400, 110, { align: "left" })
            doc.fontSize(8).text("¿Cuenta con drenaje?", 50, 140, { align: "left" })
            doc.fontSize(8).text("¿Cuenta con agua potable?", 150, 140, { align: "left" })
            doc.fontSize(8).text("Frecuencia del servicio de agua potable", 260, 140, { align: "left" })
            doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 400, 140, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 450, 120, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 80, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 190, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 310, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 450, 150, { align: "left" })
                .moveDown();
            if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 50, 170, { align: "left" })
                doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 250, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 300, 180, { align: "left" })
                    .moveDown();
            } else {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 50, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 80, 180, { align: "left" })
                    .moveDown();
            }

            if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 450, 170, { align: "left" })
                doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 450, 190, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
            } else {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
                    .moveDown();
            }


            if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
                console.log("jasdlkashdasjkhd", obj[0].cedula[0][0].Trat_Basura)
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
                    .moveDown();
            }
            if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
                    .moveDown();
            }


        }


        try {
            if (obj[0].cedula[0][0].imgb7_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb7_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_1), 'base64'), 100, 250,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de las características de la vivienda', 80, 240)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb7_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb7_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_2), 'base64'), 350, 250,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de las características de la vivienda', 340, 240)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb7_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb7_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_3), 'base64'), 100, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de las características de la vivienda', 80, 440)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb7_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb7_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_4), 'base64'), 350, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de las características de la vivienda', 340, 440)

            }
        } catch (e) { }

    }
    if (obj[0].cedula[0][0].Tipo_Propiedad == 'Rentada') {
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
        doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
        doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
        doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
            , 300, 170, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
        doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
            .moveDown();
        if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
            let Fonte = 7
            let Adrss = 200
            if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
                Fonte = 6
                Adrss = 180
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
                .moveDown();
        }
        if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
        } else {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
            doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

        }

        doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
            width: 500,
            align: 'center'
        });
        try {
            if (obj[0].cedula[0][0].imgb2_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

            }
        } catch (e) {

            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
        }

        try {
            if (obj[0].cedula[0][0].imgb2_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

            }
        } catch (e) {

            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

        }

        try {
            if (obj[0].cedula[0][0].imgb2_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

            }
        } catch (e) {

            doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

        }

        try {
            if (obj[0].cedula[0][0].imgb2_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

            }
        } catch (e) {
            doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

        }
        try {
            if (obj[0].cedula[0][0].imgb2_5 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

            }
        } catch (e) {
            doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

        }
        try {
            if (obj[0].cedula[0][0].imgb2_6 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

            }
        } catch (e) {
            doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

        }
        doc.addPage();
        try {
            if (obj[0].cedula[0][0].imgb2_7 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

            }
        } catch (e) {
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

        }
        try {
            if (obj[0].cedula[0][0].imgb2_8 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

            }
        } catch (e) {
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

        }
        try {
            if (obj[0].cedula[0][0].imgb2_9 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

            }
        } catch (e) {
            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

        }
        try {
            if (obj[0].cedula[0][0].imgFirma != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

            }
        } catch (e) {

            doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

        }



        doc.rect(80, 450, 460, 25).fillAndStroke('#FFFFFF');
        doc.fill('#661e2c').stroke();
        doc.fontSize(16);
        doc.text("NOTA: LA VIVIENDA ES " + obj[0].cedula[0][0].Tipo_Propiedad.toUpperCase() + " POSIBLE APOYO A CANCELAR", 50, 455, { lineBreak: false });
    }
    if (obj[0].cedula[0][0].Tipo_Propiedad == 'Prestada') {

        console.log("asdasdasd", obj[0].cedula[0][0].Bloque)

        if (obj[0].cedula[0][0].Autorizacion_Propietario == 'NO' && obj[0].cedula[0][0].Bloque != 7) {

            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
            doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
            doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
            doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
                , 300, 170, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
            doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
                .moveDown();
            if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
                let Fonte = 7
                let Adrss = 200
                if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
                    Fonte = 6
                    Adrss = 180
                }
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
                    .moveDown();
            }
            if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
            } else {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
                doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
                doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

            }

            doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
                width: 500,
                align: 'center'
            });
            try {
                if (obj[0].cedula[0][0].imgb2_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
            }

            try {
                if (obj[0].cedula[0][0].imgb2_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

            }

            try {
                if (obj[0].cedula[0][0].imgb2_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

                }
            } catch (e) {

                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

            }

            try {
                if (obj[0].cedula[0][0].imgb2_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_5 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_6 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

            }
            doc.addPage();
            try {
                if (obj[0].cedula[0][0].imgb2_7 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_8 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_9 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgFirma != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

            }

            /*ALERTA*/
            doc.rect(80, 450, 460, 25).fillAndStroke('#FFFFFF');
            doc.fill('#661e2c').stroke();
            doc.fontSize(16);
            doc.text("NOTA: LA VIVIENDA ES " + obj[0].cedula[0][0].Tipo_Propiedad.toUpperCase() + " POSIBLE APOYO A CANCELAR", 50, 455, { lineBreak: false });

        } else {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
            doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
            doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
            doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
                , 300, 170, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
            doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
                .moveDown();
            if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
                let Fonte = 7
                let Adrss = 200
                if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
                    Fonte = 6
                    Adrss = 180
                }
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
                    .moveDown();
            }
            if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
            } else {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
                doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
                doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

            }

            doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
                width: 500,
                align: 'center'
            });
            try {
                if (obj[0].cedula[0][0].imgb2_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)
            }

            try {
                if (obj[0].cedula[0][0].imgb2_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

            }

            try {
                if (obj[0].cedula[0][0].imgb2_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

                }
            } catch (e) {

                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

            }

            try {
                if (obj[0].cedula[0][0].imgb2_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_5 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_6 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
                        { width: 150, height: 150 });
                    doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

                }
            } catch (e) {
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

            }
            doc.addPage();
            try {
                if (obj[0].cedula[0][0].imgb2_7 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_8 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgb2_9 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

                }
            } catch (e) {
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

            }
            try {
                if (obj[0].cedula[0][0].imgFirma != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

                }
            } catch (e) {

                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

            }
            doc.addPage();

            //Bloque3
            if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
                obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
            }
            if (obj[0].cedula[0][0].Encuentra_autopista == '') {
                obj[0].cedula[0][0].Encuentra_autopista = 'NO'
            }
            if (obj[0].cedula[0][0].Encuentra_tren == '') {
                obj[0].cedula[0][0].Encuentra_tren = 'NO'
            }
            if (obj[0].cedula[0][0].Encuentra_torres == '') {
                obj[0].cedula[0][0].Encuentra_torres = 'NO'
            }
            if (obj[0].cedula[0][0].Encuentra_ductos == '') {
                obj[0].cedula[0][0].Encuentra_ductos = 'NO'
            }
            if (obj[0].cedula[0][0].Encuentra_rio == '') {
                obj[0].cedula[0][0].Encuentra_rio = 'NO'
            }
            if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
                obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
            }
            if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
                obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
            }
            if (obj[0].cedula[0][0].Muros == '') {
                obj[0].cedula[0][0].Muros = 'NO'
            }
            if (obj[0].cedula[0][0].Pisos == '') {
                obj[0].cedula[0][0].Pisos = 'NO'
            }
            if (obj[0].cedula[0][0].Techo == '') {
                obj[0].cedula[0][0].Techo = 'NO'
            }
            if (obj[0].cedula[0][0].Inclinacion == '') {
                obj[0].cedula[0][0].Inclinacion = 'NO'
            }
            if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
                obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
            }




            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
                width: 500,
                align: 'center'
            });
            doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 70, {
                width: 500,
                align: 'center'
            });
            doc.fill('#').stroke();
            doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
            doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
            doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
            doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
            doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
            doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
            doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
            doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
                .moveDown();
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

            try {
                if (obj[0].cedula[0][0].imgb3_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb3_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb3_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb3_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

                }
            } catch (e) { }
            doc.addPage();

            //Bloque4


            if (obj[0].cedula[0][0].Muros == 'SI' || obj[0].cedula[0][0].Pisos == 'SI' || obj[0].cedula[0][0].Techo == 'SI' || obj[0].cedula[0][0].Inclinacion == 'SI') {
                doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
                    width: 500,
                    align: 'center'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
                    width: 500,
                    align: 'center'
                });
                doc.fill('#').stroke();
                doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
                doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
                doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
                doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
                doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
                    .moveDown();
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
                    .moveDown();
                try {
                    if (obj[0].cedula[0][0].imgb4_1 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

                    }
                } catch (e) { }

                try {
                    if (obj[0].cedula[0][0].imgb4_2 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

                    }
                } catch (e) { }

                try {
                    if (obj[0].cedula[0][0].imgb4_3 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

                    }
                } catch (e) { }
                try {
                    if (obj[0].cedula[0][0].imgb4_4 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

                    }
                } catch (e) { }

                doc.rect(30, 650, 500, 25).fillAndStroke('#ffffff');

                doc.fill('#661e2c').stroke();
                doc.fontSize(13);
                doc.text("NOTA: EXISTEN RIESGOS INTERNOS EN LA VIVIENDA POSIBLE APOYO POR CANCELAR",
                    35, 655, { lineBreak: false });




            } else {



                doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 4 "RIESGOS INTERNOS PARA LA VIVIENDA"`, 50, 55, {
                    width: 500,
                    align: 'center'
                });
                doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿Dentro de la vivienda se observa alguna de las siguientes situaciones de riesgo para la misma o para quienes la habitan?`, 50, 70, {
                    width: 500,
                    align: 'center'
                });
                doc.fill('#').stroke();
                doc.fontSize(8).text("a)Existengrietas o fisuras en los muros", 50, 100, { align: "left" })
                doc.fontSize(8).text("b)Existengrietas en los pisos", 50, 110, { align: "left" })
                doc.fontSize(8).text("c)Existen desprendimientos de materiales en los techos", 50, 120, { align: "left" })
                doc.fontSize(8).text("d)Existen inclinaciones o hundimientos", 50, 130, { align: "left" })
                doc.fontSize(8).text("e)Ninguna de las anteriores", 50, 140, { align: "left" })
                    .moveDown();
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Muros, 300, 100, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Pisos, 300, 110, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Techo, 300, 120, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Inclinacion, 300, 130, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Ningun_Riesgo, 300, 140, { align: "left" })
                    .moveDown();
                try {
                    if (obj[0].cedula[0][0].imgb4_1 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_1), 'base64'), 100, 200,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos internos', 80, 190)

                    }
                } catch (e) { }

                try {
                    if (obj[0].cedula[0][0].imgb4_2 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_2), 'base64'), 350, 200,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos internos', 340, 190)

                    }
                } catch (e) { }

                try {
                    if (obj[0].cedula[0][0].imgb4_3 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_3), 'base64'), 100, 450,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos internos', 80, 440)

                    }
                } catch (e) { }
                try {
                    if (obj[0].cedula[0][0].imgb4_4 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb4_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb4_4), 'base64'), 350, 450,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos internos', 340, 440)

                    }
                } catch (e) { }
            }
            doc.addPage();

            let ahorros_F = 8
            let ahorros_P = 80

            if (obj[0].cedula[0][0].Cuenta_Ahorros.length >= 25) {

                ahorros_F = 6
                ahorros_P = 45
            }
            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 5 "DATOS SOCIOECONÓMICOS DE LA VIVIENDA"`, 50, 75, {
                width: 500,
                align: 'center'
            });
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso total mensual?", 50, 100, { align: "left" })
            doc.fontSize(8).text("Además de usted, ¿cuántos integrantes de la familia contribuyen al ingreso de la vivienda?", 250, 100, { align: "left" })
            doc.fontSize(8).text("Aproximadamente ¿cuál es su ingreso mensual familiar?", 50, 125, { align: "left" })
            doc.fontSize(7).text("¿Cuenta con quien le puede ayudar en sus trabajos de obra o tiene la posibilidad de contratar a alguien que le guíe o se encargue de la obra?", 250, 125, { align: "left" })
            doc.fontSize(8).text("¿Usted cuenta con cuentas de ahorro?", 50, 150, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualI, 100, 110, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Integrantes_Contribuyen, 400, 110, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Ingreso_MensualF, 100, 135, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Ayuda_Trabajos, 350, 133, { align: "left" })
            doc.fontSize(ahorros_F).text(obj[0].cedula[0][0].Cuenta_Ahorros, ahorros_P, 160, { align: "left" })
                .moveDown();


            if (obj[0].cedula[0][0].Cuenta_Ahorros == 'No cuenta con ninguna') {
                if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
                    doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 50, 180, { align: "left" })
                    doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 180, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 220, 160, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 80, 190, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 390, 190, { align: "left" })
                        .moveDown();
                    if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
                        doc.fill('#b8925f').stroke();
                        doc.fontSize(8).text("A quien pidio prestado", 50, 210, { align: "left" })
                            .moveDown();
                        doc.fill('#').stroke();
                        doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 50, 220, { align: "left" })
                    }
                } else {
                    let FuenteCredito = 8;
                    let PosCredito = 220;
                    if (obj[0].cedula[0][0].Tarjetas_Credito.length >= 25) {
                        FuenteCredito = 7;
                        PosCredito = 200;
                    }
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 220, 150, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(FuenteCredito).text(obj[0].cedula[0][0].Tarjetas_Credito, PosCredito, 160, { align: "left" })
                        .moveDown();
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿En el último año ha pedido prestado?", 380, 150, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Prestado, 380, 160, { align: "left" })
                        .moveDown();
                    if (obj[0].cedula[0][0].Prestado == 'Otro (especifique)') {
                        doc.fill('#b8925f').stroke();
                        doc.fontSize(8).text("A quien pidio prestado", 50, 180, { align: "left" })
                            .moveDown();
                        doc.fill('#').stroke();
                        doc.fontSize(8).text(obj[0].cedula[0][0].txtPrestado, 65, 190, { align: "left" })
                    }


                }

            } else {
                if (obj[0].cedula[0][0].cmbCuentaAhorros <= 6) {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Si tiene tarjeta de débito (de las señaladas en la pregunta anterior) generalmente, ¿cuántas veces al mes utiliza su tarjeta de débito para pagar compras en establecimientos comerciales, tiendas o restaurantes?", 240, 150, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Debito, 290, 168, { align: "left" })
                        .moveDown();
                    if (obj[0].cedula[0][0].nuevo_catalogo <= 2) {
                        doc.fill('#b8925f').stroke();
                        doc.fontSize(8).text("¿Cuál es la razón principal por la que no utiliza o casi no utiliza su tarjeta de débito para hacer compras o pagos?", 50, 185, { align: "left" })
                            .moveDown();
                        doc.fill('#').stroke();
                        doc.fontSize(8).text(obj[0].cedula[0][0].Usa_DebitoMes, 50, 195, { align: "left" })
                            .moveDown();
                    }
                    if (obj[0].cedula[0][0].usa_debito_mes == 10) {
                        doc.fill('#b8925f').stroke();
                        doc.fontSize(8).text("Especifique", 50, 210, { align: "left" })
                            .moveDown();
                        doc.fill('#').stroke();
                        doc.fontSize(8).text(obj[0].cedula[0][0].txtUsaDebitoMes, 50, 220, { align: "left" })
                            .moveDown();


                    }
                    if (obj[0].cedula[0][0].Tarjetas_CreditoN != 6) {
                        doc.fill('#b8925f').stroke();
                        doc.fontSize(8).text("¿Usted tiene cuentas de crédito?", 50, 220, { align: "left" })
                        doc.fontSize(8).text("Generalmente, ¿cuántas veces al mes utiliza su tarjeta de crédito bancaria o departamental?", 200, 220, { align: "left" })
                            .moveDown();
                        doc.fill('#').stroke();
                        doc.fontSize(8).text(obj[0].cedula[0][0].Tarjetas_Credito, 50, 230, { align: "left" })
                        doc.fontSize(8).text(obj[0].cedula[0][0].Usa_CreditoMes, 250, 230, { align: "left" })
                            .moveDown();
                    }






                }

            }

            /*BLOQUE6*/




            if (obj[0].integrantes == '[]') {
                doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
                    width: 500,
                    align: 'center'
                });

                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
            } else {


                doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 6 "DATOS DE LOS HABITANTES DE LA VIVIENDA"`, 50, 210, {
                    width: 500,
                    align: 'center'
                });

                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Cuál es el número de habitantes de la vivienda?", 200, 240, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].cmbHabitantesI, 280, 250, { align: "left" })
                try {
                    if (obj[0].cedula[0][0].imgb6_1 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb6_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_1), 'base64'), 100, 280,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los Integrantes', 80, 270)

                    }
                } catch (e) { }
                try {
                    if (obj[0].cedula[0][0].imgb6_2 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb6_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_2), 'base64'), 350, 280,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los Integrantes', 340, 270)

                    }
                } catch (e) { }

                try {
                    if (obj[0].cedula[0][0].imgb6_3 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb6_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_3), 'base64'), 100, 480,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los Integrantes', 80, 470)

                    }
                } catch (e) { }
                try {
                    if (obj[0].cedula[0][0].imgb6_4 != "") {
                        doc.image(new Buffer(obj[0].cedula[0][0].imgb_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb6_4), 'base64'), 350, 480,
                            { width: 150, height: 150 });
                        doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los Integrantes', 340, 470)

                    }
                } catch (e) { }
                doc.addPage({ layout: 'landscape' })

                const table = {
                    headers: ["id_unico", "Curp", "Nombre", "Edad integrante", "Genero", "Dependiente beneficirio", "Feje de hogar", "Madre soltera", "Derecho habiente", "Se considera indigena", "Contribuye ingreso", "Actividad economica", "A que se dedica", "Parentesco integrante", "Tiene discapacidad", "Problema discapacidad", "Causa dificultad", "Enfermedad degenerativa", "Grado estudios", "Estado vivian", "Es migranre", "Tipo migrante", "Tipo ingreso", "Qué tipo de ingresos"],
                    rows: []
                };
                let patients = obj[0].integrantes
                //console.log("valio verga la vda",patients)
                for (const patient of patients) {
                    table.rows.push([patient.id_unico, patient.curp_integrante, patient.nombre_integrante, patient.edad_integrante, patient.sex, patient.Dependiente_benefIntegrante, patient.Feje_hogarIntegrante, patient.MadreSolteraIntegrante, patient.DerechohabienteIteraIntegrante, patient.IndigenaI, patient.ContribuyeIngresoIteraIntegrante, patient.ActividadEconomicaI, patient.QuehaceIntegrante, patient.ParentescoIntegrante, patient.TieneDiscapacidadIntegrante, patient.ProblemaDiscapacidadIntegrante, patient.CausaDificultadIntegrante, patient.DegenerativaIntegrante, patient.GradoEstudiosIntegrante, patient.Estado_Vivían, patient.MigranteI, patient.TipoMigracionIntegrante, patient.TipoIngresosIntegrante, patient.txtTipoIngresosI])

                }



                doc.table(table, {
                    x: 25,
                    y: 130,
                    columnSpacing: 10,
                    padding: 1,
                    columnsSize: [100, 100, 135],
                    prepareHeader: () => doc.font("Times-Roman").fontSize(10).fillColor("#000000"),
                    prepareRow: () => doc.font("Times-Roman").fontSize(5),

                });


            }

            doc.addPage();



            doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 7 "CARACTERÍSTICAS DE LA VIVIENDA"`, 50, 60, {
                width: 500,
                align: 'center'
            });
            var matMuros = 8;
            var pMuros = 50;
            if (obj[0].cedula[0][0].MatMuros.length >= 20) {
                matMuros = 8;
                pMuros = 30;
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿Cuántas recámaras tiene la vivienda?", 50, 90, { align: "left" })
            doc.fontSize(8).text("¿De qué material es el techo de la vivienda?", 220, 90, { align: "left" })
            doc.fontSize(8).text("¿Con qué tipo de piso cuenta la vivienda?", 400, 90, { align: "left" })
            doc.fontSize(8).text("¿De qué material son los muros de la vivienda?", 50, 110, { align: "left" })
            doc.fontSize(8).text("¿La vivienda cuenta con escusado?", 250, 110, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Recamaras, 100, 100, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].MatTecho, 260, 100, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].MatPiso, 420, 100, { align: "left" })
            doc.fontSize(matMuros).text(obj[0].cedula[0][0].MatMuros, pMuros, 118, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Escusado, 290, 120, { align: "left" })
            if (obj[0].cedula[0][0].Escusado == 'NO') {
                let txtCocinarP = 240;
                let txtCocinarF = 8;
                let txtEscusadoP = 400
                let txtEscusadoF = 8
                let txtEscusadoU = 120
                if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
                    txtCocinarP = 180
                    txtCocinarF = 7
                }
                if (obj[0].cedula[0][0].txtEscusado.length >= 30) {
                    txtEscusadoP = 380
                    txtEscusadoF = 6
                    txtEscusadoU = 117
                }
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("Que servicio ocupa", 400, 110, { align: "left" })
                doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 50, 140, { align: "left" })
                doc.fontSize(8).text("¿Cuenta con drenaje?", 190, 140, { align: "left" })
                doc.fontSize(8).text("¿Cuenta con agua potable?", 290, 140, { align: "left" })
                doc.fontSize(8).text("Frecuencia del servicio de agua potable", 400, 140, { align: "left" })
                doc.fill('#').stroke();
                doc.fontSize(txtEscusadoF).text(obj[0].cedula[0][0].txtEscusado, txtEscusadoP, 120, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 90, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 230, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 310, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 430, 150, { align: "left" })
                if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                    doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 220, 170, { align: "left" })
                    doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 400, 170, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                    doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 450, 180, { align: "left" })
                        .moveDown();
                } else {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                    doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
                        //doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
                        // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 178, { align: "left" })
                        .moveDown();
                }
                if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 50, 200, { align: "left" })
                    doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 280, 200, { align: "left" })
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 50, 210, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 310, 210, { align: "left" })
                } else {
                    doc.fill('#b8925f').stroke();
                    //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                    //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
                    doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 400, 170, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                    //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 445, 180, { align: "left" })
                        .moveDown();
                }




            } else {
                let txtCocinarP = 50;
                let txtCocinarF = 8;
                if (obj[0].cedula[0][0].txtCombCocinar.length >= 30) {
                    txtCocinarP = 180
                    txtCocinarF = 7
                }
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Cuenta con energía eléctrica?", 400, 110, { align: "left" })
                doc.fontSize(8).text("¿Cuenta con drenaje?", 50, 140, { align: "left" })
                doc.fontSize(8).text("¿Cuenta con agua potable?", 150, 140, { align: "left" })
                doc.fontSize(8).text("Frecuencia del servicio de agua potable", 260, 140, { align: "left" })
                doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 400, 140, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].Electrica, 450, 120, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Drenaje, 80, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Potable, 190, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Frec_Potable, 310, 150, { align: "left" })
                doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 450, 150, { align: "left" })
                    .moveDown();

                if (obj[0].cedula[0][0].Comb_Cocinar == 'Otro') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Que tipo de combustible se utiliza para la cocina", 50, 170, { align: "left" })
                    doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 250, 170, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(txtCocinarF).text(obj[0].cedula[0][0].txtCombCocinar, txtCocinarP, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 300, 180, { align: "left" })
                        .moveDown();
                } else {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 50, 170, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 80, 180, { align: "left" })
                        .moveDown();
                }

                if (obj[0].cedula[0][0].Comb_Agua == 'Otro') {
                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("Que tipo de combustible que se usa para calentar el agua", 280, 170, { align: "left" })
                    doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
                    doc.fill('#').stroke();
                    doc.fontSize(8).text(obj[0].cedula[0][0].txtCombAgua, 280, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
                } else {
                    doc.fill('#b8925f').stroke();
                    //doc.fontSize(8).text("Tipo de combustible que se usa para cocinar", 50, 170, { align: "left" })
                    //doc.fontSize(8).text("Tipo de combustible que se usa para calentar el agua", 210, 170, { align: "left" })
                    doc.fontSize(8).text("¿Qué tipo de tratamiento se le da a la basura en donde vive?", 50, 200, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    // doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Cocinar, 80, 180, { align: "left" })
                    //doc.fontSize(8).text(obj[0].cedula[0][0].Comb_Agua, 230, 180, { align: "left" })
                    doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 50, 210, { align: "left" })
                        .moveDown();




                }


                if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {

                    console.log("askdlhadadjhsjajskhadjskhadsjkhdjkh", obj[0].cedula[0][0].Trat_Basura)

                    doc.fill('#b8925f').stroke();
                    doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
                        .moveDown();
                    doc.fill('#').stroke();
                    // doc.fontSize(8).text(obj[0].cedula[0][0].Trat_Basura, 250, 210, { align: "left" })
                    // .moveDown();
                }


            }
            if (obj[0].cedula[0][0].Trat_Basura == 'Otro') {
                doc.fill('#b8925f').stroke();
                doc.fontSize(8).text("¿Qué hace con la basura?", 300, 200, { align: "left" })
                    .moveDown();
                doc.fill('#').stroke();
                doc.fontSize(8).text(obj[0].cedula[0][0].txtTratBasura, 300, 210, { align: "left" })
                    .moveDown();
            }

            try {
                if (obj[0].cedula[0][0].imgb7_1 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb7_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_1), 'base64'), 100, 250,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de las características de la vivienda', 80, 240)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb7_2 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb7_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_2), 'base64'), 350, 250,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de las características de la vivienda', 340, 240)

                }
            } catch (e) { }

            try {
                if (obj[0].cedula[0][0].imgb7_3 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb7_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_3), 'base64'), 100, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de las características de la vivienda', 80, 440)

                }
            } catch (e) { }
            try {
                if (obj[0].cedula[0][0].imgb7_4 != "") {
                    doc.image(new Buffer(obj[0].cedula[0][0].imgb7_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb7_4), 'base64'), 350, 450,
                        { width: 150, height: 150 });
                    doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de las características de la vivienda', 340, 440)

                }
            } catch (e) { }
        }
    }
    if (obj[0].cedula[0][0].Tipo_Propiedad == 'Propia' && obj[0].cedula[0][0].Bloque == '3') {

        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text("¿Cuenta con la autorización del propietario para la realización de los trabajos?", 50, 140, { align: "left" })
        doc.fontSize(8).text("Especificar el tipo de documento comprobante de la propiedad?", 350, 140, { align: "left" })
        doc.fontSize(8).text("Tipo de adquisición de la vivienda", 50, 170, { align: "left" })
        doc.fontSize(8).text("¿Recibió apoyo de algún organismo público o privado para vivienda (reconstrucción, remodelación, ampliación y/o sustitución, adquisición de vivienda nueva o en uso)?"
            , 300, 170, { align: "left" })
            .moveDown();
        doc.fill('#').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Autorizacion_Propietario, 50, 150, { align: "left" }) //
        doc.fontSize(8).text(obj[0].cedula[0][0].Comprobante_Propiedad, 350, 150, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Adquisicion, 80, 180, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Apoyo_Organismo, 250, 190, { align: "center" })
            .moveDown();
        if (obj[0].cedula[0][0].Tipo_Adquisicion == 'Otra') {
            let Fonte = 7
            let Adrss = 200
            if (obj[0].cedula[0][0].txtTipoAdquisicion.length >= 18) {
                Fonte = 6
                Adrss = 180
            }
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique", 200, 170, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(Fonte).text(obj[0].cedula[0][0].txtTipoAdquisicion, Adrss, 180, { align: "left" })
                .moveDown();
        }
        if (obj[0].cedula[0][0].Apoyo_Organismo == 'NO') {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 50, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 70, 210, { align: "left" })
        } else {
            doc.fill('#b8925f').stroke();
            doc.fontSize(8).text("Especifique tipo de apoyo", 50, 200, { align: "left" })
            doc.fontSize(8).text("Año de recepción del apoyo recibido", 180, 200, { align: "left" })
            doc.fontSize(8).text("¿La vivienda es ocupada para realizar alguna actividad económica?", 340, 200, { align: "left" })
                .moveDown();
            doc.fill('#').stroke();
            doc.fontSize(8).text(obj[0].cedula[0][0].Tipo_Apoyo, 50, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].txtAnioApoyo, 230, 210, { align: "left" })
            doc.fontSize(8).text(obj[0].cedula[0][0].Vivienda_Aeconomica, 450, 210, { align: "left" })

        }

        doc.font("Times-Bold").fontSize(12).fillColor('#661e2c').text(`Comprobantes Documentales`, 50, 250, {
            width: 500,
            align: 'center'
        });
        try {
            if (obj[0].cedula[0][0].imgb2_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_1), 'base64'), 50, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('comprobante de domicilio', 75, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_2), 'base64'), 230, 280,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('INE del propietario', 260, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_3), 'base64'), 410, 280,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de la autorización del propietario', 410, 270)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb2_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_4), 'base64'), 50, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de la autorización del propietario', 50, 450)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_5 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_5.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_5), 'base64'), 230, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de la autorización del propietario', 230, 450)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_6 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_6.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_6), 'base64'), 410, 460,
                    { width: 150, height: 150 });
                doc.fontSize(6).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de la autorización del propietario', 410, 450)

            }
        } catch (e) { }
        doc.addPage();
        try {
            if (obj[0].cedula[0][0].imgb2_7 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_7.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_7), 'base64'), 50, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Carta bajo protesta de decir verdad', 50, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_8 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_8.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_8), 'base64'), 230, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 1', 230, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb2_9 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb2_9.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb2_9), 'base64'), 410, 100,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Fotografía de la vivienda 2', 410, 90)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgFirma != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgFirma.replace('data:image/png;base64,', obj[0].cedula[0][0].imgFirma), 'base64'), 230, 300,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Firma del solicitante', 280, 290)

            }
        } catch (e) { }
        doc.addPage();

        //Bloque3
        if (obj[0].cedula[0][0].Asentamiento_ilegal == '') {
            obj[0].cedula[0][0].Asentamiento_ilegal = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_autopista == '') {
            obj[0].cedula[0][0].Encuentra_autopista = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_tren == '') {
            obj[0].cedula[0][0].Encuentra_tren = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_torres == '') {
            obj[0].cedula[0][0].Encuentra_torres = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_ductos == '') {
            obj[0].cedula[0][0].Encuentra_ductos = 'NO'
        }
        if (obj[0].cedula[0][0].Encuentra_rio == '') {
            obj[0].cedula[0][0].Encuentra_rio = 'NO'
        }
        if (obj[0].cedula[0][0].Riesgo_derrumbe == '') {
            obj[0].cedula[0][0].Riesgo_derrumbe = 'NO'
        }
        if (obj[0].cedula[0][0].Riesgo_ninguno == '') {
            obj[0].cedula[0][0].Riesgo_ninguno = 'NO'
        }
        if (obj[0].cedula[0][0].Muros == '') {
            obj[0].cedula[0][0].Muros = 'NO'
        }
        if (obj[0].cedula[0][0].Pisos == '') {
            obj[0].cedula[0][0].Pisos = 'NO'
        }
        if (obj[0].cedula[0][0].Techo == '') {
            obj[0].cedula[0][0].Techo = 'NO'
        }
        if (obj[0].cedula[0][0].Inclinacion == '') {
            obj[0].cedula[0][0].Inclinacion = 'NO'
        }
        if (obj[0].cedula[0][0].Ningun_Riesgo == '') {
            obj[0].cedula[0][0].Ningun_Riesgo = 'NO'
        }

        doc.font("Times-Bold").fontSize(15).fillColor('#661e2c').text(`BLOQUE 3 "RIESGOS EN EL ENTORNO DE LA VIVIENDA"`, 50, 55, {
            width: 500,
            align: 'center'
        });
        doc.font("Times-Bold").fontSize(10).fillColor('#661e2c').text(`¿En el lugar en el que se ubica la vivienda o en sus cercanías encontramos alguna de las siguientes situaciones?`, 50, 80, {
            width: 500,
            align: 'center'
        });
        doc.fill('#').stroke();
        doc.fontSize(8).text("a) Es un asentamiento ilegal (invasión), área verde o está en litigio", 50, 100, { align: "left" })
        doc.fontSize(8).text("b) Existe una autopista", 50, 110, { align: "left" })
        doc.fontSize(8).text("c) Existen vías del tren", 50, 120, { align: "left" })
        doc.fontSize(8).text("d) Existen torres de alta tensión", 50, 130, { align: "left" })
        doc.fontSize(8).text("e) Existen ductos de gas, gasolina o PEMEX", 50, 140, { align: "left" })
        doc.fontSize(8).text("f) Existen cauces de ríos o cuerpos de agua", 50, 150, { align: "left" })
        doc.fontSize(8).text("g) Existe el riesgo de derrumbes o pendientes pronunciadas", 50, 160, { align: "left" })
        doc.fontSize(8).text("h) Ninguna de las anteriores", 50, 170, { align: "left" })
            .moveDown();
        doc.fill('#b8925f').stroke();
        doc.fontSize(8).text(obj[0].cedula[0][0].Asentamiento_ilegal, 300, 100, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_autopista, 300, 110, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_tren, 300, 120, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_torres, 300, 130, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_ductos, 300, 140, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Encuentra_rio, 300, 150, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_derrumbe, 300, 160, { align: "left" })
        doc.fontSize(8).text(obj[0].cedula[0][0].Riesgo_ninguno, 300, 170, { align: "left" })

        try {
            if (obj[0].cedula[0][0].imgb3_1 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_1.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_1), 'base64'), 100, 200,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 1 de los riesgos en el entorno', 80, 190)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb3_2 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_2.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_2), 'base64'), 350, 200,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 2 de los riesgos en el entorno', 340, 190)

            }
        } catch (e) { }

        try {
            if (obj[0].cedula[0][0].imgb3_3 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_3.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_3), 'base64'), 100, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 3 de los riesgos en el entorno', 80, 440)

            }
        } catch (e) { }
        try {
            if (obj[0].cedula[0][0].imgb3_4 != "") {
                doc.image(new Buffer(obj[0].cedula[0][0].imgb3_4.replace('data:image/png;base64,', obj[0].cedula[0][0].imgb3_4), 'base64'), 350, 450,
                    { width: 150, height: 150 });
                doc.fontSize(8).font("Times-Bold").fill('#b8925f').text('Evidencia fotográfica 4 de los riesgos en el entorno', 340, 440)

            }
        } catch (e) { }


        doc.rect(30, 650, 550, 25).fillAndStroke('#FFFFFF');

        doc.fill('#661e2c').stroke();
        doc.fontSize(12);
        doc.text("NOTA: EXISTEN RIESGOS EN EL ENTORNO DE LA VIVIENDA POSIBLE APOYO A CANCELAR",
            30, 655, { lineBreak: false });





    }




}
function genera_pdf_pmv(obj, res) {

    //console.log("consola para id_unico", obj[0].cedula[0][0].id_unico)
    const PDFDocument = require("./pdfkit-tables");
    const doc = new PDFDocument({ margin: 30, bufferPages: true });
    res.writeHead(200, {

        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;  "attachment; filename=' + obj[0].cedula[0][0].id_unico + "_PMV.pdf"
    });
    pdfPmv(obj, doc);
    doc.pipe(res);

    doc.fontSize(12);
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < (range.start + range.count); i++) {
        doc.switchToPage(i);

        doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/Villa.png", 10, 720,
            { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
                { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento

        doc.image("C:/Administracion_usuarioss/Administracion_usuarios/cliente/src/components/HEADER.png", 5, -10,
            { width: 600 }).fillColor('#444444').fontSize(20).text('', 80, 50).fontSize(8).text('', 200, 80,
                { align: 'center' }).moveDown(); // Aqui se genera el encabezado del documento





    }

    doc.end();
};
app.get('/api/get_pmv_c1/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    ObtenerIntegrantes(id_unico,
        function (result) {
            var id = result;
            const sqlSelect = "call prod_pmv.sp_get_usPmv(?);";  //PRODUCCION            
            db.query(sqlSelect, [id_unico], (err, result_) => {
                if (result == "") {

                } else { // res.send(result[0])
                    let obj = [{ "cedula": result_, "integrantes": id }]
                    genera_pdf_pmv(obj, res);
                }
            });
        });
});
function ObtenerIntegrantes(id_unico, callback) {
    const sqlSelect = "call prod_pmv.sp_get_habitantes_c1(?)" //PRODUCCION 
    db.query(sqlSelect, [id_unico], (err, result) => {
        if (result[0] == '') {
            return callback('[]')
        } else {
            return callback(result[0]);
        }



    });
}



// router.get('/api/get_pmv_tabla/:usuario', (req, res) => {
//     const usuario = req.params.usuario;
//     ObtenerPermisoPmv(usuario,
//         function (result) {
//             edos = result;
//             const sqlSelect = "SELECT c1.id_unico,txtCURP as curp,bloque,CONCAT(txtNombre,' ',txtPrimer_apellido, ' ',txtSegundo_apellido) AS Nombre,concat(txtCalle,' N° ',txtNum_int,' N.EXT ',txtNum_ext,' ',txtColonia,' ',txtCp,' ',IFNULL(l.nombre_localidad, ' '),', ',ce.nombre_estado ) as domicilio,concat('<i id=\"',c1.id_unico,'\"class=\"fas fa-caret-square-up\"></i>') as hola_ FROM prod_pmv.pmv_captura_c1 c1 LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = c1.cmbClave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = c1.cmbClave_estado AND mn.id_municipio = c1.cmbClave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = c1.cmbClave_localidad AND l.id_municipio = c1.cmbClave_municipio AND l.id_estado = c1.cmbClave_estado WHERE c1.cve_bajal = 'A' and c1.cmbClave_estado in(" + edos + ");";
//         cn.db().query(sqlSelect, (err, result) => {
//                 res.send(result);
//             });

//         });
//        /* cn.db().getConnection(function (err, connection) {
// 			  connection.query(sqlSelect,(err, result) => {
// 				res.send(result);
// 				connection.destroy();
// 			});
// 		});*/

// });






app.get('/api/ext_edos', (req, res) => {
    const sqlSelect =
        "SELECT nombre_estado, id_estado, COUNT(folio) AS numero_de_folios,CONCAT('<i id=\"', id_estado, '\" class=\"fas fa-pencil-alt\"></i>') as hola_ FROM world.pnv_cis_padron_new AS p WHERE latitud IS NOT NULL AND longitud IS NOT NULL AND latitud <> '' AND longitud <> '' AND NOT EXISTS ( SELECT 1 FROM world.datos_asignados AS d WHERE d.id_estado = p.id_estado) GROUP BY nombre_estado, id_estado;"
    db1.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });

});








app.get('/api/ext_edo_id/:id_estado', (req, res) => {
    const sqlSelect =
        "SELECT nombre_estado,id_estado,COUNT(folio) AS numero_de_folios FROM world.pnv_cis_padron_new where id_estado =? and latitud IS NOT NULL AND longitud IS NOT NULL AND latitud <> '' AND longitud <> ''  GROUP BY nombre_estado, id_estado;";
    const id_estado = req.params.id_estado;
    db1.query(sqlSelect, [id_estado], (err, result) => {
        res.send(result);
    });
});
app.get('/api/get_empresa', (req, res) => {
    const sqlSelect =
        "SELECT cve_empresa, descripcion FROM world.empresa_verificacion order by cve_empresa;"
    db1.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
app.get('/api/get_verificadoras', (req, res) => {
    const email = req.params.email;
    const sqlSelect = "SELECT cve_empresa as value, descripcion as label FROM world.empresa_verificacion order by cve_empresa;	"; //PRODUCCION
    db1.query(sqlSelect, (err, result) => {
        console.log(err);
        res.send(result);
        //  console.log("RESULTADO EMPRESAS VERIFICADORAS", result)
    });
});

// app.get('/api/get_info/:id_estado', (req, res) => {
//     const sqlSelect =
//         "SELECT folio,curp,latitud,longitud FROM world.pnv_cis_padron_new WHERE id_estado = ? and latitud is not null and longitud is not null";
//     const id_estado = req.params.id_estado;
//     db1.query(sqlSelect, [id_estado], (err, result) => {
//         res.send(result);
//     });
// });

app.post('/api/insertar_folios', (req, res) => {
    const curp = req.body.curp
    const folio = req.body.folio
    const nombre_verificadora = req.body.nombre_verificadora
    const latitud = req.body.latitud
    const longitud = req.body.longitud
    const estado = req.body.estado

    const sqlInsert = "insert into world.datos_asignados values(?,?,?,?,?,?)";  //PRODUCCION    
    let a = db1.query(sqlInsert, [curp, folio, nombre_verificadora, latitud, longitud, estado],
        (err, result) => {
            console.log(a)
            res.send(result);
            console.log("REGISTRO GUARDADO CON EXITO(FUNCIÓN NORMAL)")
        });

});
app.get('/api/ext_tableExcel', (req, res) => {
    const sqlSelect =
        "SELECT pn.nombre_estado,COUNT(pn.folio) AS acciones,CONCAT('<i id=\"', pn.id_estado, '\" class=\"fas fa-file-excel\"></i>') as hola_ FROM world.pnv_cis_padron_new pn INNER JOIN world.datos_asignados da ON da.curp = binary pn.curp GROUP BY pn.nombre_estado, pn.id_estado;"
    db1.query(sqlSelect, (err, result) => {
        console.log(err)
        res.send(result);
    });
});
function ExcelCompleto(API_RESPONSE, res) {
    // let API_RESPONSE = weatherData.data.list

    console.log(API_RESPONSE)

    var wb = new xl.Workbook();
    var ws = wb.addWorksheet("ACCIONES");
    var style = wb.createStyle({
        font: {
            name: "Helvetica",
            size: 11,
            vertical: "center",
            patternType: "solid",
        },
    });
    var array = [
        "FOLIO",
        "CURP",
        "ID_ESTADO",
        "ID_MUNICIPIO",
        "ID_LOCALIDAD",
        "NOMBRE_ESTADO",
        "NOMBRE_MUNICIPIO",
        "NOMBRE_LOCALIDAD",
        "CODIGO_POSTAL",
        "PROGRAMA",
        "RFC_SUP",
        "MODALIDAD",
        "LINEA_APOYO",
        "EV",
        "LATITUD",
        "LONGITUD",
        "x"
    ];
    for (a = 0; a < array.length - 1; a++) {
        ws.cell(1, a + 1)
            .string(array[a])
            .style({
                fill: {
                    type: "pattern",
                    fgColor: "#A9A9F5",
                    bold: true,
                    size: 20,
                    patternType: "solid",
                    shrinkToFit: true,
                },
            });
    }
    for (a = 0; a < API_RESPONSE.length; a++) {
        ws.cell(a + 2, 1)
            .string(API_RESPONSE[a].folio)
            .style(style);
        ws.cell(a + 2, 2)
            .string(API_RESPONSE[a].curp)
            .style(style);
        ws.cell(a + 2, 3)
            .number(API_RESPONSE[a].id_estado)
            .style(style);
        ws.cell(a + 2, 4)
            .number(API_RESPONSE[a].id_municipio)
            .style(style);
        ws.cell(a + 2, 5)
            .number(API_RESPONSE[a].id_localidad)
            .style(style);
        ws.cell(a + 2, 6)
            .string(API_RESPONSE[a].nombre_estado)
            .style(style);
        ws.cell(a + 2, 7)
            .string(API_RESPONSE[a].nombre_municipio)
            .style(style);
        ws.cell(a + 2, 8)
            .string(API_RESPONSE[a].nombre_localidad)
            .style(style);
        ws.cell(a + 2, 9)
            .string(API_RESPONSE[a].codigo_postal)
            .style(style);
        ws.cell(a + 2, 10)
            .string(API_RESPONSE[a].programa)
            .style(style);
        ws.cell(a + 2, 11)
            .string(API_RESPONSE[a].rfc_sup)
            .style(style);
        ws.cell(a + 2, 12)
            .string(API_RESPONSE[a].modalidad)
            .style(style);
        ws.cell(a + 2, 13)
            .string(API_RESPONSE[a].linea_apoyo)
            .style(style);
        ws.cell(a + 2, 14)
            .string(API_RESPONSE[a].EV)
            .style(style);
        ws.cell(a + 2, 15)
            .string(API_RESPONSE[a].latitud)
            .style(style);
        ws.cell(a + 2, 16)
            .string(API_RESPONSE[a].longitud)
            .style(style);

    }

    wb.write("Reporte estados.xlsx", res);
    console.log(res);
}
app.get("/api/reporteEstados/:id_estado", (req, res) => {
    const id_estado = req.params.id_estado;
    const sqlSelect = "SELECT pn.folio,pn.curp,pn.id_estado,pn.id_municipio,pn.id_localidad,pn.nombre_estado,pn.nombre_municipio,pn.nombre_localidad,pn.codigo_postal,pn.programa,pn.rfc_sup,pn.modalidad,pn.modalidad AS linea_apoyo,da.nombre_verificadora AS EV,pn.latitud,pn.longitud FROM world.pnv_cis_padron_new pn inner join world.datos_asignados da on da.curp = binary pn.curp WHERE da.id_estado = ?;";
    db1.query(sqlSelect, [id_estado], (err, result) => {
        console.log("RESULTADO PARA EL EXCEL", result)
        if (result == "") {

        } else {

        }
        ExcelCompleto(result, res);
    });
});
app.get("/api/getExcelGeneral", (req, res) => {
    const sqlSelect = "SELECT pn.folio,pn.curp,pn.id_estado,pn.id_municipio,pn.id_localidad,pn.nombre_estado,pn.nombre_municipio,pn.nombre_localidad,pn.codigo_postal,pn.programa,pn.rfc_sup,pn.modalidad,pn.modalidad AS linea_apoyo,da.nombre_verificadora AS EV,pn.latitud,pn.longitud FROM world.pnv_cis_padron_new pn inner join world.datos_asignados da on da.curp = binary pn.curp;";
    db1.query(sqlSelect, (err, result) => {
        console.log("RESULTADO PARA EL EXCEL", result)
        if (result == "") {

        } else {

        }
        getExcelCompleto(result, res);
    });
});
function getExcelCompleto(API_RESPONSE, res) {
    // let API_RESPONSE = weatherData.data.list

    console.log(API_RESPONSE)

    var wb = new xl.Workbook();
    var ws = wb.addWorksheet("ACCIONES");
    var style = wb.createStyle({
        font: {
            name: "Helvetica",
            size: 11,
            vertical: "center",
            patternType: "solid",
        },
    });
    var array = [
        "FOLIO",
        "CURP",
        "ID_ESTADO",
        "ID_MUNICIPIO",
        "ID_LOCALIDAD",
        "NOMBRE_ESTADO",
        "NOMBRE_MUNICIPIO",
        "NOMBRE_LOCALIDAD",
        "CODIGO_POSTAL",
        "PROGRAMA",
        "RFC_SUP",
        "MODALIDAD",
        "LINEA_APOYO",
        "EV",
        "LATITUD",
        "LONGITUD",
        "x"
    ];
    for (a = 0; a < array.length - 1; a++) {
        ws.cell(1, a + 1)
            .string(array[a])
            .style({
                fill: {
                    type: "pattern",
                    fgColor: "#A9A9F5",
                    bold: true,
                    size: 20,
                    patternType: "solid",
                    shrinkToFit: true,
                },
            });
    }
    for (a = 0; a < API_RESPONSE.length; a++) {
        ws.cell(a + 2, 1)
            .string(API_RESPONSE[a].folio)
            .style(style);
        ws.cell(a + 2, 2)
            .string(API_RESPONSE[a].curp)
            .style(style);
        ws.cell(a + 2, 3)
            .number(API_RESPONSE[a].id_estado)
            .style(style);
        ws.cell(a + 2, 4)
            .number(API_RESPONSE[a].id_municipio)
            .style(style);
        ws.cell(a + 2, 5)
            .number(API_RESPONSE[a].id_localidad)
            .style(style);
        ws.cell(a + 2, 6)
            .string(API_RESPONSE[a].nombre_estado)
            .style(style);
        ws.cell(a + 2, 7)
            .string(API_RESPONSE[a].nombre_municipio)
            .style(style);
        ws.cell(a + 2, 8)
            .string(API_RESPONSE[a].nombre_localidad)
            .style(style);
        ws.cell(a + 2, 9)
            .string(API_RESPONSE[a].codigo_postal)
            .style(style);
        ws.cell(a + 2, 10)
            .string(API_RESPONSE[a].programa)
            .style(style);
        ws.cell(a + 2, 11)
            .string(API_RESPONSE[a].rfc_sup)
            .style(style);
        ws.cell(a + 2, 12)
            .string(API_RESPONSE[a].modalidad)
            .style(style);
        ws.cell(a + 2, 13)
            .string(API_RESPONSE[a].linea_apoyo)
            .style(style);
        ws.cell(a + 2, 14)
            .string(API_RESPONSE[a].EV)
            .style(style);
        ws.cell(a + 2, 15)
            .string(API_RESPONSE[a].latitud)
            .style(style);
        ws.cell(a + 2, 16)
            .string(API_RESPONSE[a].longitud)
            .style(style);

    }

    wb.write("Reporte general.xlsx", res);
    console.log(res);
}





// APIS NUEVAS
app.get('/api/ext_edosPrueba/:curps', (req, res) => {
    const curpString = req.params.curps; // CURP como una cadena separada por comas
    const curps = curpString.split(',').map(curp => curp.trim()); // Convierte la cadena en un array de CURP

    // Usa GROUP_CONCAT para concatenar los folios de CURP en la consulta SQL
    const sqlSelect = `
        SELECT 
            nombre_estado, 
            id_estado, 
            COUNT(distinct folio) AS numero_de_folios, 
            GROUP_CONCAT(folio SEPARATOR ', ') AS hola_
        FROM 
            world.pnv_cis_padron_new AS p
        WHERE 
            latitud IS NOT NULL 
            AND longitud IS NOT NULL 
            AND latitud <> '' 
            AND longitud <> '' 
            AND NOT EXISTS (
                SELECT 1 
                FROM world.datos_asignados AS d 
                WHERE d.id_estado = p.id_estado
            ) 
            AND folio IN (${curps.map(curp => `'${curp}'`).join(', ')})
        GROUP BY nombre_estado, id_estado;`;

    db1.query(sqlSelect, (err, result) => {
        console.log(err);
        //console.log(result);
        res.send(result);
    });
});


app.get('/api/ext_edo_id_/:folios', (req, res) => {
    const curpString = req.params.folios; // Obtén los folios desde los parámetros
    const folios = curpString.split(',').map(folio => folio.trim()); // Convierte la cadena en un array de folios

    const sqlSelect = `
        SELECT nombre_estado, id_estado, COUNT(distinct folio) AS numero_de_folios
        FROM world.pnv_cis_padron_new
        WHERE folio IN (${folios.map(folio => `'${folio}'`).join(', ')})
        AND latitud IS NOT NULL
        AND longitud IS NOT NULL
        AND latitud <> ''
        AND longitud <> ''
        GROUP BY nombre_estado, id_estado;`;

    db1.query(sqlSelect, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error en la consulta SQL' });
        } else {
            res.send(result);
        }
    });
});

app.get('/api/get_info_/:folios', (req, res) => {
    const curpString = req.params.folios; // Obtén los folios desde los parámetros
    const folios = curpString.split(',').map(folio => folio.trim()); // Convierte la cadena en un array de folios

    const sqlSelect = `
        SELECT folio, curp, latitud, longitud
        FROM world.pnv_cis_padron_new
        WHERE folio IN (${folios.map(folio => `'${folio}'`).join(', ')})
        AND latitud IS NOT NULL
        AND longitud IS NOT NULL;`;

    db1.query(sqlSelect, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error en la consulta SQL' });
        } else {
            res.send(result);
        }
    });
});