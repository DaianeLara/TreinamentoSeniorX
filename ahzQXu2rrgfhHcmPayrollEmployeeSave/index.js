
/**
 * Nome da primitiva : employeeSave
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn29689424
 **/

const axios = require("axios");

exports.handler = async event => {

let body = parseBody(event);

let tokenSeniorX = event.headers['X-Senior-Token'];

const instance = axios.create({
  baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
  headers: {
    'Authorization': tokenSeniorX
  }
});

//valida tamanho do campo apelido maior que 10 caracteres
if(body.sheetPersona.nickname){
  if(body.sheetPersona.nickname.length > 10){
  return sendRes(400, 'O apelido deve ter no maximo 10 caracteres!');
  }
}  else{
  return sendRes(400, 'O apelido deve ser informado!');
}

//valida se a foto do colaborador está presente
if(!body.sheetPersona.attachment){
  return sendRes(400, 'A foto do colaborador deve ser informada');
}

//Não permitir alterar o CPF do colaborador
if (body.sheetInitial.employee){
  let employee = await instance.get(`/hcm/payroll/entities/employee/${body.sheetInitial.employee.tableId}`);

  if (employee.data.person.cpf !== body.sheetDocument.cpfNumber){
    return sendRes(400, 'Não é permitido alterar o CPF do colaborador - Teste Nani!');
  }
}

/*Valida Campo customizado em conjunto com campo nativo*/
if ((body.sheetContract.customFieldsEmployee) && (body.sheetComplement.issueDotCard)) {

  let customFields = body.sheetContract.customFieldsEmployee;
  let issueDotCard = body.sheetComplement.issueDotCard;

  //Percorre o array de campos customizados
  for (let customField of customFields) {
    if (customField.field === 'USU_CARCON') {
      if ((customField.value === 'S') && (issueDotCard.key === 'Yes')) {
        return sendRes(400, 'Colaboradores com Cargo de confiança não devem emitir cartão Ponto!');
      }
    }
  }
}

//Quando for deficiente, preenchimento de cota deve ser sim
  if ((body.sheetPersona.isDisability === "true") && (body.sheetPersona.isOccupantQuota === "false")){
      return sendRes (400, 'Quando deficiente deve preencher cota!');
  }


//caso todas as validações passem
  return sendRes(200, JSON.parse(event.body));

};

const parseBody = (event) => {
  return typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
};

const sendRes = (status,body) => {
  body.testeCustomizacao = "Teste de regra";

  var response = {
    statusCode:status,
    headers: {
      "Content-Type":"application/json"
    },
    body:typeof body ==='string' ? body : JSON.stringify(body)
  };
  return response;
};