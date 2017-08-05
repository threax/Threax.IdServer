﻿using NJsonSchema;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;
using Threax.AspNetCore.Models;

namespace Threax.ModelGen
{
    class ModelTypeGenerator
    {
        public static String Create(String name, ITypeWriter typeWriter, String usings, String ns, String prettyName = null)
        {
            var sb = new StringBuilder(usings);
            sb.AppendLine();
            sb.AppendLine(typeWriter.StartNamespace(ns));

            if (!String.IsNullOrWhiteSpace(prettyName))
            {
                sb.AppendLine(typeWriter.AddTypeDisplay(NameGenerator.CreatePascal(prettyName)));
            }

            sb.AppendLine(typeWriter.StartType(name));

            sb.AppendLine(typeWriter.EndType());
            sb.AppendLine(typeWriter.EndNamespace());

            return sb.ToString();
        }

        public static String Create(JsonSchema4 schema, ITypeWriter typeWriter, JsonSchema4 rootSchema, String usings, String ns)
        {
            var sb = new StringBuilder(usings);
            sb.AppendLine();
            sb.AppendLine(typeWriter.StartNamespace(ns));
            if (!String.IsNullOrWhiteSpace(schema.Title))
            {
                sb.AppendLine(typeWriter.AddTypeDisplay(schema.Title)); //Probably not right
            }
            sb.Append(typeWriter.StartType(schema.Title));

            var prettyName = schema.Title;

            String prettyNamePascal, prettyNameCamel;
            NameGenerator.CreatePascalAndCamel(prettyName, out prettyNamePascal, out prettyNameCamel);

            foreach (var propPair in schema.Properties)
            {
                sb.AppendLine();

                var propName = propPair.Key;
                var prop = propPair.Value;

                if (prop.MaxLength.HasValue)
                {
                    string error = null; //Look this up somehow
                    if (String.IsNullOrWhiteSpace(error))
                    {
                        error = $"{prettyNamePascal} must be less than {prop.MaxLength} characters.";
                    }
                    sb.AppendLine(typeWriter.AddMaxLength(prop.MaxLength.Value, error));
                }

                if (prop.IsRequired)
                {
                    string error = null; //Look this up somehow
                    if (String.IsNullOrWhiteSpace(error))
                    {
                        error = $"{prettyNamePascal} must have a value.";
                    }
                    sb.AppendLine(typeWriter.AddRequired(error));
                }

                if (!String.IsNullOrWhiteSpace(prop.Title))
                {
                    sb.AppendLine(typeWriter.AddDisplay(prop.Title));
                }

                sb.AppendLine(typeWriter.CreateProperty(GetType(prop), NameGenerator.CreatePascal(propName)));
            }

            sb.AppendLine(typeWriter.EndType());
            sb.AppendLine(typeWriter.EndNamespace());

            return sb.ToString();
        }

        private static string GetType(JsonProperty prop)
        {
            var type = GetNonArrayType(prop.Type, prop.Format);
            
            if (IsType(prop.Type, JsonObjectType.Array))
            {
                type = $"List<{GetNonArrayType(prop.Item.Type, prop.Item.Format)}>";
            }

            return type;
        }

        private static string GetNonArrayType(JsonObjectType types, String format)
        {
            var type = "String";

            if (IsType(types, JsonObjectType.Integer) || IsType(types, JsonObjectType.Number))
            {
                String simpleType = "decimal";
                if (IsType(types, JsonObjectType.Integer))
                {
                    simpleType = "int";
                    switch (format)
                    {
                        case "int16":
                            simpleType = "short";
                            break;
                        case "int32":
                            simpleType = "int";
                            break;
                        case "int64":
                            simpleType = "long";
                            break;
                    }
                }
                if (IsType(types, JsonObjectType.Number))
                {
                    simpleType = "decimal";
                    switch (format)
                    {
                        case "int16":
                            simpleType = "short";
                            break;
                        case "int32":
                            simpleType = "int";
                            break;
                        case "int64":
                            simpleType = "long";
                            break;
                        case "single":
                            simpleType = "float";
                            break;
                        case "double":
                            simpleType = "double";
                            break;
                        case "decimal":
                            simpleType = "decimal";
                            break;
                    }
                }
                type = simpleType + GetNullable(types);
            }
            if (IsType(types, JsonObjectType.Boolean))
            {
                type = "bool" + GetNullable(types);
            }
            if (IsType(types, JsonObjectType.String) || IsType(types, JsonObjectType.File))
            {
                type = "String";
                switch (format)
                {
                    case "date":
                    case "time":
                    case "date-time":
                        type = "DateTime" + GetNullable(types); //Overrides completely since date time can be nullable
                        break;
                }
            }

            if (IsType(types, JsonObjectType.Object))
            {
                type = "Object";
                if (IsType(types, JsonObjectType.Array))
                {

                }
                else
                {

                }
            }

            return type;
        }

        static String GetNullable(JsonObjectType types)
        {
            String extra = "";
            if (IsType(types, JsonObjectType.Null))
            {
                extra += "?";
            }
            return extra;
        }

        static bool IsType(JsonObjectType types, JsonObjectType type)
        {
            return (types & type) == type;
        }
    }
}
