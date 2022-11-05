<h1 align="center">
  Magictable 🚀
</h1>

<h4 align="center">Transform any HTML table into a Magic table!</h4>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://github.com/julien37/magictable/blob/main/demo/magictable.gif?raw=true)

## Features
* Cells navigation with keyboard
* Progressive data loading
* Searching
* Sorting
* Refresh table
* Update cells (text, number, dropdown, date, time, comment)
* Delete rows
* Export to Excel (need TableToExcel.js)

## How To Use
To use Magictable, you need add to your project, `magictable.js` and `magictable.css` from `src/` folder. You must have jQuery library.

After you'll able to use Magictable function. Here's parameters :

1. URL for retrieving data (API must send JSON data)
2. If you want to get just a part of your JSON, specify the key
3. URL for updating cell
4. URL for deleting row(s)
5. Numbers of rows you want to load (0 for no pagination)
6. Specify the data model of your table. See below for examples.
7. Specify if you want to allow cells editing (true / false)
8. Specify if you want to allow rows deleting (true / false)
9. If you specify true, Magictable will request your GET API with keyword parameter. If you specify false, Magictable will search in data loaded



```javascript
let dataModel = {};
dataModel['Id'] = {field:"id", fieldType: 'number', picklist: {},editable:false};
dataModel['Creation date'] = {field:"creationDate", fieldType: 'date', picklist: {},editable:true};
dataModel['Creation time'] = {field:"creationTime", fieldType: 'time', picklist: {},editable:true};
dataModel['Company'] = {field:"company", fieldType: 'text', picklist: {},editable:true};
dataModel['Country'] = {field:"country", fieldType: 'text', picklist: {},editable:true};
dataModel['Industry'] = {field:"industry", fieldType: 'picklist', picklist: ['Agriculture','Apparel','Banking','Biotechnology','Chemicals','Communications','Construction','Consulting','Education','Electronics','Energy','Engineering','Entertainment','Environmental','Finance','Food & Beverage','Government','Healthcare','Hospitality','Insurance','Machinery','Manufacturing','Media','Not For Profit','Recreation','Retail','Shipping','Technology','Telecommunications','Transportation','Utilities','Other'],editable:true};
dataModel['Number of employees'] = {field:"employees", fieldType: 'number', picklist: {},editable:true};
dataModel['Website'] = {field:"website", fieldType: 'text', picklist: {},editable:true};
dataModel['Comment'] = {field:"comment", fieldType: 'comment', picklist: {},editable:true};

Magictable('https://raw.githubusercontent.com/julien37/magictable/main/demo/data.json','','','',0,dataModel,true,true,false);
```

> **Note**
> If you want more examples with APIs source code, send me a message.

You can also check online [demo](https://julien37.github.io/magictable/demo/).

## Credits

This software uses the following open source packages:

- [jQuery](https://jquery.com/)
- [tableToExcel](https://github.com/linways/table-to-excel)

## License
MIT
