using NJsonSchema;
using System;
using System.IO;

namespace Threax.ModelGen
{
    class Program
    {
        static void Main(string[] args)
        {
            GenerateClasses(args[0], args[1]);
        }

        private static void GenerateClasses(String ns, String source)
        {
            String modelName;

            try
            {
                JsonSchema4 schema;
                try
                {
                    var schemaTask = NJsonSchema.JsonSchema4.FromJsonAsync(source);
                    schemaTask.Wait();
                    schema = schemaTask.Result;
                }
                catch (Exception)
                {
                    if (!File.Exists(source))
                    {
                        throw;
                    }
                    else
                    {
                        var schemaTask = NJsonSchema.JsonSchema4.FromFileAsync(source);
                        schemaTask.Wait();
                        schema = schemaTask.Result;
                    }
                }
                Console.WriteLine(ModelTypeGenerator.Create(schema, new IdInterfaceWriter(), schema, "", ns + ".Models"));
                Console.WriteLine(ModelTypeGenerator.Create(schema, new EntityWriter(), schema, "", ns + ".Database"));
                Console.WriteLine(ModelTypeGenerator.Create(schema, new InputModelWriter(), schema, "", ns + ".InputModels"));
                Console.WriteLine(ModelTypeGenerator.Create(schema, new ViewModelWriter(), schema, "", ns + ".ViewModels"));
                modelName = schema.Title;
            }
            catch (Exception) //If there was a problem tread source as the name, if it has no whitespace in it
            {
                if (HasWhitespace(source))
                {
                    throw;
                }

                Console.WriteLine(ModelTypeGenerator.Create(source, new IdInterfaceWriter(), "", ns + ".Models"));
                Console.WriteLine(ModelTypeGenerator.Create(source, new EntityWriter(), "", ns + ".Database"));
                Console.WriteLine(ModelTypeGenerator.Create(source, new InputModelWriter(), "", ns + ".InputModels"));
                Console.WriteLine(ModelTypeGenerator.Create(source, new ViewModelWriter(), "", ns + ".ViewModels"));


                modelName = source;
            }

            Console.WriteLine(RepoGenerator.Get(ns, modelName));
            Console.WriteLine(RepoInterfaceGenerator.Get(ns, modelName));
            Console.WriteLine(ControllerGenerator.Get(ns, modelName));
            Console.WriteLine(MappingGenerator.Get(ns, modelName));
            Console.WriteLine(RepoConfigGenerator.Get(ns, modelName));
            Console.WriteLine(AppDbContextGenerator.Get(ns, modelName));

            Console.ReadKey();
        }

        private static bool HasWhitespace(String test)
        {
            foreach (var c in test)
            {
                if (Char.IsWhiteSpace(c))
                {
                    return true;
                }
            }
            return false;
        }
    }
}