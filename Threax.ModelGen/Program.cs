using NJsonSchema;
using System;
using System.IO;

namespace Threax.ModelGen
{
    class Program
    {
        static void Main(string[] args)
        {
            GenerateClasses(args[0], args[1], args[2]);
        }

        private static void GenerateClasses(String ns, String source, String outDir)
        {
            String modelName;

            String model, entity, inputModel, viewModel;

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
                model = ModelTypeGenerator.Create(schema, new IdInterfaceWriter(), schema, ns, ns + ".Models");
                entity = ModelTypeGenerator.Create(schema, new EntityWriter(), schema, ns, ns + ".Database");
                inputModel = ModelTypeGenerator.Create(schema, new InputModelWriter(), schema, ns, ns + ".InputModels");
                viewModel = ModelTypeGenerator.Create(schema, new ViewModelWriter(), schema, ns, ns + ".ViewModels");
                modelName = schema.Title;
            }
            catch (Exception) //If there was a problem tread source as the name, if it has no whitespace in it
            {
                if (HasWhitespace(source))
                {
                    throw;
                }

                model = ModelTypeGenerator.Create(source, new IdInterfaceWriter(), ns, ns + ".Models");
                entity = ModelTypeGenerator.Create(source, new EntityWriter(), ns, ns + ".Database");
                inputModel = ModelTypeGenerator.Create(source, new InputModelWriter(), ns, ns + ".InputModels");
                viewModel = ModelTypeGenerator.Create(source, new ViewModelWriter(), ns, ns + ".ViewModels");

                modelName = source;
            }

            WriteFile(Path.Combine(outDir, $"Models/I{modelName}.cs"), model);
            WriteFile(Path.Combine(outDir, $"Database/{modelName}Entity.cs"), entity);
            WriteFile(Path.Combine(outDir, $"InputModels/{modelName}Input.cs"), inputModel);
            WriteFile(Path.Combine(outDir, $"ViewModels/{modelName}.cs"), viewModel);

            WriteFile(Path.Combine(outDir, $"Repository/{modelName}Repository.cs"), RepoGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"Repository/I{modelName}Repository.cs"), RepoInterfaceGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"Repository/{modelName}RepoConfig.cs"), RepoConfigGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"Controllers/{modelName}sController.cs"), ControllerGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"Mappings/{modelName}Mapper.cs"), MappingGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"Database/AppDbContext{modelName}.cs"), AppDbContextGenerator.Get(ns, modelName));
            WriteFile(Path.Combine(outDir, $"ViewModels/{modelName}Collection.cs"), ModelCollectionGenerator.Get(ns, modelName));
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

        private static void WriteFile(String file, String content)
        {
            var folder = Path.GetDirectoryName(file);
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            using(var writer = new StreamWriter(File.Open(file, FileMode.Create, FileAccess.Write, FileShare.None)))
            {
                writer.Write(content);
            }
        }
    }
}