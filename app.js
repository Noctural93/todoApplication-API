const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();

const pathDb = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let db = null;

const initializeDbToServer = async (request, response) => {
  try {
    db = await open({
      filename: pathDb,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`);
    process.exit(1);
  }
};

initializeDbToServer();

const convertObjToReqObj = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// Get Method
app.get("/todos/", async (request, response) => {
  const { search_q = "", category, priority, status } = request.query;
  let getTodoQuery = "";
  let dbResponse = null;
  switch (true) {
    //Scenario 3
    case priority !== undefined && status !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`;
          dbResponse = await db.all(getTodoQuery);
          response.send(
            dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario 5
    case category !== undefined && status !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND category = '${category}';`;
          dbResponse = await db.all(getTodoQuery);
          response.send(
            dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 7
    case category !== undefined && priority !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND category = '${category}';`;
          dbResponse = await db.all(getTodoQuery);
          response.send(
            dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 2
    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
        dbResponse = await db.all(getTodoQuery);
        response.send(
          dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario 1
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
        dbResponse = await db.all(getTodoQuery);
        response.send(
          dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Scenario 6
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`;
        dbResponse = await db.all(getTodoQuery);
        response.send(
          dbResponse.map((eachItem) => convertObjToReqObj(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 4
    default:
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      dbResponse = await db.all(getTodoQuery);
      response.send(dbResponse.map((eachItem) => convertObjToReqObj(eachItem)));
      break;
  }
});

// Get particular Todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const reqQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(convertObjToReqObj(dbResponse));
});

// Get Method using date as query parameter
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const reqQuery = `
    SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dbResponse = await db.all(reqQuery);
    if (dbResponse !== undefined) {
      response.send(dbResponse.map((eachItem) => convertObjToReqObj(eachItem)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// Post Method
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (isValid(new Date(dueDate))) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const reqQuery = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          const dbResponse = await db.run(reqQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

// Put Method
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  const givenIdQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;
  const givenDbRes = await db.get(givenIdQuery);
  if (givenDbRes !== undefined) {
    switch (true) {
      case status !== undefined:
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          const reqQuery = `
                UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
          const dbResponse = await db.run(reqQuery);
          response.send("Status Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        break;
      case priority !== undefined:
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          const reqQuery = `
                UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
          const dbResponse = await db.run(reqQuery);
          response.send("Priority Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        break;
      case category !== undefined:
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          const reqQuery = `
                UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
          const dbResponse = await db.run(reqQuery);
          response.send("Category Updated");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        break;
      case dueDate !== undefined:
        if (isValid(new Date(dueDate))) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const reqQuery = `
                UPDATE todo SET due_date = '${newDate}' WHERE id = ${todoId};`;
          const dbResponse = await db.run(reqQuery);
          response.send("Due Date Updated");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
        break;
      default:
        if (todo !== undefined) {
          const reqQuery = `
                UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
          const dbResponse = await db.run(reqQuery);
          response.send("Todo Updated");
        }
        break;
    }
  }
});

//Delete Method
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const reqQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(reqQuery);
  response.send("Todo Deleted");
});

module.exports = app;
