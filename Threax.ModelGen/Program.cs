using System;

namespace Threax.ModelGen
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine(RepoGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(RepoInterfaceGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(ControllerGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(MappingGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(RepoConfigGenerator.Get("CoolNamespace", "TheBestModel"));

            var schemaTask = NJsonSchema.JsonSchema4.FromJsonAsync(schemaSrc);
            schemaTask.Wait();
            var schema = schemaTask.Result;
            Console.WriteLine(ModelTypeGenerator.Create(schema, new InterfaceWriter(), schema, "", "CoolNamespace"));
            Console.WriteLine(ModelTypeGenerator.Create(schema, new ClassWriter(), schema, "", "CoolNamespace"));

            Console.ReadKey();
        }

        static String schemaSrc = @"{
  ""title"": ""Title of Input"",
  ""type"": ""object"",
  ""additionalProperties"": false,
  ""properties"": {
    ""first"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 18
    },
    ""middle"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 21
    },
    ""last"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 24
    },
    ""stringArray"": {
      ""type"": [ ""array"", ""null"" ],
      ""items"": { ""type"": ""string"" },
      ""x-ui-order"": 1
    },
    ""complexArray"": {
      ""type"": [ ""array"", ""null"" ],
      ""items"": {
        ""type"": ""object"",
        ""properties"": {
          ""first"": {
            ""type"": [
              ""null"",
              ""string""
            ],
            ""x-ui-order"": 18
          },
          ""middle"": {
            ""type"": [
              ""null"",
              ""string""
            ],
            ""x-ui-order"": 21
          },
          ""last"": {
            ""type"": [
              ""null"",
              ""string""
            ],
            ""x-ui-order"": 24
          }
        }
      },
      ""x-ui-order"": 2
    },
    ""multiChoice"": {
      ""title"": ""Multi Choice"",
      ""type"": [
        ""array"",
        ""null""
      ],
      ""items"": {
        ""type"": ""integer"",
        ""format"": ""int32""
      },
      ""x-ui-type"": ""select"",
      ""x-ui-order"": 1,
      ""x-values"": [
        {
          ""label"": ""Choice 1"",
          ""value"": 1
        },
        {
          ""label"": ""Choice 2"",
          ""value"": 2
        }
      ]
    },
    ""checktest"": {
      ""type"": [
        ""boolean""
      ],
      ""x-ui-order"": 24
    },
    ""comboTest"": {
      ""title"": ""Site"",
      ""type"": ""integer"",
      ""format"": ""int32"",
      ""x-ui-order"": 27,
      ""x-values"": [
        {
          ""label"": ""Choice 1"",
          ""value"": ""one""
        },
        {
          ""label"": ""Choice 2"",
          ""value"": ""two""
        }
      ]
    },
    ""enumTest"": {
      ""type"": ""string"",
      ""description"": """",
      ""x-enumNames"": [
        ""Name 1"",
        ""Name 2"",
        ""Name 3""
      ],
      ""enum"": [
        ""Name1"",
        ""Name2"",
        ""Name3""
      ],
      ""x-ui-order"": 38
    },
    ""dateTest"": {
      ""type"": ""date"",
      ""format"": ""date-time"",
      ""x-ui-order"": 50
    },
    ""address"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 53
    },
    ""city"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 56
    },
    ""state"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 59
    },
    ""zipcode"": {
      ""type"": [
        ""null"",
        ""string""
      ],
      ""x-ui-order"": 62
    }
  },
  ""x-is-array"": false
}";
    }
}