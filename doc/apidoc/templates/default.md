# <%= project.name %> v<%= project.version %>

<%= project.description %>

<% Object.keys(data).forEach(function (group) { -%>
- [<%= group %>](#<%=: group | mlink %>)
	<% Object.keys(data[group]).forEach(function (sub) { -%>
- [<%= data[group][sub][0].title %>](#<%=: data[group][sub][0].title | mlink %>)
	<% }); -%>

<% }); %>

<% if (prepend) { -%>
<%- prepend %>
<% } -%>
<% Object.keys(data).forEach(function (group) { -%>
# <%= group %>

<% Object.keys(data[group]).forEach(function (sub) { -%>
## <%= data[group][sub][0].title %>

<%-: data[group][sub][0].description | undef %>

	<%-: data[group][sub][0].type | upcase %> <%= data[group][sub][0].url %>

<% if (data[group][sub][0].header && data[group][sub][0].header.fields.Header.length) { -%>
### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
<% data[group][sub][0].header.fields.Header.forEach(function (header) { -%>
| <%- header.field %>			| <%- header.type %>			| <%- header.optional ? '**optional**' : '' %> <%- header.description %>							|
<% }); //forech parameter -%>
<% } //if parameters -%>
<% if (data[group][sub][0].parameter && data[group][sub][0].parameter.fields.Parameter.length) { -%>

### Parameters

| Name    | Type      | Attribute      | Description                          |
|---------|-----------|--------------------------------------|
<% data[group][sub][0].parameter.fields.Parameter.forEach(function (param) { -%>
| <%- param.field %>			| <%- param.type %>	| <%- param.optional ? 'Optional' : 'Required' %>|  <%- param.description %>							|
<% }); //forech parameter -%>
<% } //if parameters -%>
<% if (data[group][sub][0].examples && data[group][sub][0].examples.length) { -%>

### Examples
<% data[group][sub][0].examples.forEach(function (example) { -%>
<%= example.title %>

```
<%- example.content %>
```
<% }); //foreach example -%>
<% } //if example -%>

<% if (data[group][sub][0].success && data[group][sub][0].success.fields) { -%>
<% var successSta = Object.keys(data[group][sub][0].success.fields)[0] %>
### <%=successSta%>
| Field    | Type        | Description                          |
|---------|-----------|--------------------------------------|
<% data[group][sub][0].success.fields[successSta].forEach(function (field) { -%>
| <%- field.field %>| <%- field.type %>| <%- field.description %>|
<% }); //forech fields -%>
<% } //if examples -%>

<% if (data[group][sub][0].success && data[group][sub][0].success.examples && data[group][sub][0].success.examples.length) { -%>
### Success Response

<% data[group][sub][0].success.examples.forEach(function (example) { -%>
<%= example.title %>

```
<%- example.content %>
```
<% }); //foreach success example -%>
<% } //if examples -%>

<% if (data[group][sub][0].error && data[group][sub][0].error.examples && data[group][sub][0].error.examples.length) { -%>
### Error Response

<% data[group][sub][0].error.examples.forEach(function (example) { -%>
<%= example.title %>

```
<%- example.content %>
```
<% }); //foreach error example -%>
<% } //if examples -%>
<% }); //foreach sub  -%>
<% }); //foreach group -%>

