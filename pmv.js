const express = require('express');
const router = express.Router();
const cn = require("./conexion/conexion.js")
const bodyParser = require('body-parser');
const cors = require('cors');
router.use(cors());
router.use(express.json({ limit: "50mb" }));
router.use(bodyParser.urlencoded({ limit: "50mb", extended: false }))
router.use(bodyParser.json({ limit: "50mb" }))


function ObtenerPermisoPmv(email, callback) {
    const sqlSelect = "SELECT id,cnfg_edo,email FROM prod_adms.cnfg_permisos where id_modulo= 704 and email = ?;" //PRODUCCION   
    cn.db().query(sqlSelect, [email], (err, result) => {
        return callback(result[0].cnfg_edo);
    });
}
router.get('/pmv/get_pmv_tabla/:usuario', (req, res) => {
    const usuario = req.params.usuario;
    ObtenerPermisoPmv(usuario,
        function (result) {
            edos = result;
            const sqlSelect = "SELECT c1.id_unico,txtCURP as curp,bloque,CONCAT(txtNombre,' ',txtPrimer_apellido, ' ',txtSegundo_apellido) AS Nombre,concat(txtCalle,' N° ',txtNum_int,' N.EXT ',txtNum_ext,' ',txtColonia,' ',txtCp,' ',IFNULL(l.nombre_localidad, ' '),', ',ce.nombre_estado ) as domicilio,concat('<i id=\"',c1.id_unico,'\"class=\"fas fa-caret-square-up\"></i>') as hola_ FROM prod_pmv.pmv_captura_c1 c1 LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = c1.cmbClave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = c1.cmbClave_estado AND mn.id_municipio = c1.cmbClave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = c1.cmbClave_localidad AND l.id_municipio = c1.cmbClave_municipio AND l.id_estado = c1.cmbClave_estado WHERE c1.cve_bajal = 'A' and c1.cmbClave_estado in(" + edos + ");";
            cn.db().query(sqlSelect, (err, result) => {
                res.send(result);
            });

        });


});
router.get('/pmv/get_pmv_id/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect = "call prod_pmv.sp_get_usPmv(?)";
    cn.db().query(sqlSelect, [id_unico], (err, result) => {
        res.send(result[0]);
    });
});
router.get('/pmv/get_pmv_tabla_habitantes/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =

        "call prod_pmv.sp_get_habitantes(?)";

    cn.db().query(sqlSelect, [id_unico], (err, result) => {


        res.send(result[0]);







    });
});
router.get('/pmv/get_pmv_tabla_habitantes_individual/:id', (req, res) => {
    const id = req.params.id;
    const sqlSelect =

        "call prod_pmv.sp_get_habitantes_Individual(?)";

    cn.db().query(sqlSelect, [id], (err, result) => {

        //var string = result[0][0].imgb1_1.toString('base64'); 

        res.send(result[0]);




    });
});
router.get('/pmv/get_benficiarios_solventa/:usuario', (req, res) => {

    const usuario = req.params.usuario;
    ObtenerPermisoPmv(usuario,
        function (result) {

            edos = result;
            const sqlSelect =
                "SELECT ps.id_unico ,CURPR,concat (pcs.Nombre, ' ',pcs.Primer_apellido, ' ',pcs.Segundo_apellido) as Nombre,ps.cve_bajal, concat(ce.nombre_estado, ' ',mn.nombre_municipio, ' ', IFNULL(l.nombre_localidad, '')) as domicilio,concat('<i id=\"',ps.id_unico,'\"class=\"fas fa-info-circle\"></i>') as hola_  FROM prod_pmv.pmv_solventa ps join prod_pev.pev_captura_c2_sr pcs on pcs.id_unico = ps.id_unico LEFT JOIN prod_ctls.cat_estado ce ON ce.id_estado = pcs.clave_estado LEFT JOIN prod_pev.cat_municipio mn ON mn.id_estado = pcs.Clave_estado AND mn.id_municipio = pcs.Clave_municipio LEFT JOIN prod_ctls.cat_localidad l ON l.id_localidad = pcs.Clave_localidad AND l.id_municipio = pcs.Clave_municipio AND l.id_estado = pcs.Clave_estado where ps.cve_bajal = 'A'   and pcs.Clave_estado in(" + edos + ") group by id_unico;";
            cn.db().query(sqlSelect, (err, result) => {


                res.send(result);
            });

        });


});
router.get('/pmv/get_pmv_solventa/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =
        "call prod_pmv.sp_get_pmvSolventa(?)";
    cn.db().query(sqlSelect, [id_unico], (err, result) => {

        res.send(result[0]);
    });
});
router.get('/pmv/get_solventa_pmv/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect =

        "SELECT pcs.Nombre,pcs.Primer_apellido,pcs.Segundo_apellido,CURPR,Nombre_ine,Primer_apellido_ine,Segundo_apellido_ine,folio, curp, modulo, Pintura, Puertas, Impermeabilizacion, electrica, hidraulica, Ecotecnias, Fosa, Exteriores, Techo, Muros, Firme, Cuarto, Bano, Cocina, Estructurales, Terminacion, ps.Cuenta_ayude_trabajos, Beneficiario_aporto, Cantidad_aporto, TO_BASE64  (imgEvidencia_carta) as imgEvidencia_carta, TO_BASE64 (imgEvidencia_entrega) as imgEvidencia_entrega,  ps.cve_bajal, ps.id_unico FROM prod_pmv.pmv_solventa ps join prod_pev.pev_captura_c2_sr pcs on pcs.id_unico = ps.id_unico where ps.id_unico = ? and ps.cve_bajal ='A'  group by id_unico;";
    cn.db().query(sqlSelect, [id_unico], (err, result) => {

        res.send(result);




    });
});
router.get('/pmv/get_img_solventaS/:id_unico', (req, res) => {
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
    cn.db().query(sqlSelect, [id_unico], (err, result) => {

        res.send(result[0]);
    });
});
router.get('/pmv/get_img_PmvFotos/:id_unico', (req, res) => {
    const id_unico = req.params.id_unico;
    const sqlSelect = "call prod_pmv.sp_fotos_pmvc1(?);"
    cn.db().query(sqlSelect, [id_unico], (err, result) => {

        if (result[0] == []) {
            res.send("[{\"fotos\": \"INEXISTENTES\"\}]");
        } else {
            res.send(result[0]);
        }


    });
});
router.get('/pmv/sesionPMV/:email/:psw', (req, res) => {

    //parametros
    const email = req.params.email;
    const psw = req.params.psw;
    const sqlSelect =

        //String consulta
        "select upper(concat(us.nombre,' ',us.apellidos))as nombre,us.email,us.perfil,\n" +
        "(select replace(replace(replace((select json_arrayagg(concat(md.descripcion,'|',md.url))  from\n" +
        "prod_adms.cnfg_modulos md\n" +
        "inner join prod_adms.cnfg_permisos pr on pr.id_modulo = md.id_modulo\n" +
        "where pr.email =? and pr.id_modulo between 500 and 599 and cve_bajal='A'),'\"',''),'[',''),']','')) as modulos\n" +
        "from prod_adms.cnfg_permisos pr inner join prod_adms.cnfg_usuarios us on pr.email = us.email\n" +
        "where pr.email = ? and id_modulo=500 and password = sha2(?,256);\n";

    //ejecurtar consulta
    cn.db().query(sqlSelect, [email, email, psw], (err, result) => {

        if (result == "") {
            res.send("[{\"nombre\": \"INEXISTENTE\"\}]");
        } else {
            res.send(result);
        }

    });
});
module.exports = router;