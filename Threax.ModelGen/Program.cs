using NJsonSchema;
using System;
using System.IO;

namespace Threax.ModelGen
{
    class Program
    {
        static void Main(string[] args)
        {
            GenerateClasses(new GeneratorSettings()
            {
                ServiceNamespace = args[0],
                Source = args[1],
                ServiceOutDir = args[2],
                UiOutDir = args[3],
                UiNamespace = args[4]
            });
        }

        class GeneratorSettings
        {
            public String ServiceNamespace { get; set; }

            public String Source { get; set; }

            public String ServiceOutDir { get; set; }

            public String UiOutDir { get; set; }

            public String UiNamespace { get; set; }
        }

        private static void GenerateClasses(GeneratorSettings settings)
        {
            String modelName;

            String model, entity, inputModel, viewModel;

            try
            {
                JsonSchema4 schema;
                try
                {
                    var schemaTask = NJsonSchema.JsonSchema4.FromJsonAsync(settings.Source);
                    schemaTask.Wait();
                    schema = schemaTask.Result;
                }
                catch (Exception)
                {
                    if (!File.Exists(settings.Source))
                    {
                        throw;
                    }
                    else
                    {
                        var schemaTask = NJsonSchema.JsonSchema4.FromFileAsync(settings.Source);
                        schemaTask.Wait();
                        schema = schemaTask.Result;
                    }
                }
                model = ModelTypeGenerator.Create(schema, new IdInterfaceWriter(), schema, settings.ServiceNamespace, settings.ServiceNamespace + ".Models");
                entity = ModelTypeGenerator.Create(schema, new EntityWriter(), schema, settings.ServiceNamespace, settings.ServiceNamespace + ".Database");
                inputModel = ModelTypeGenerator.Create(schema, new InputModelWriter(), schema, settings.ServiceNamespace, settings.ServiceNamespace + ".InputModels");
                viewModel = ModelTypeGenerator.Create(schema, new ViewModelWriter(), schema, settings.ServiceNamespace, settings.ServiceNamespace + ".ViewModels");
                modelName = schema.Title;
            }
            catch (Exception) //If there was a problem tread source as the name, if it has no whitespace in it
            {
                if (HasWhitespace(settings.Source))
                {
                    throw;
                }

                model = ModelTypeGenerator.Create(settings.Source, new IdInterfaceWriter(), settings.ServiceNamespace, settings.ServiceNamespace + ".Models");
                entity = ModelTypeGenerator.Create(settings.Source, new EntityWriter(), settings.ServiceNamespace, settings.ServiceNamespace + ".Database");
                inputModel = ModelTypeGenerator.Create(settings.Source, new InputModelWriter(), settings.ServiceNamespace, settings.ServiceNamespace + ".InputModels");
                viewModel = ModelTypeGenerator.Create(settings.Source, new ViewModelWriter(), settings.ServiceNamespace, settings.ServiceNamespace + ".ViewModels");

                modelName = settings.Source;
            }

            WriteFile(Path.Combine(settings.ServiceOutDir, $"Models/I{modelName}.cs"), model);
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Database/{modelName}Entity.cs"), entity);
            WriteFile(Path.Combine(settings.ServiceOutDir, $"InputModels/{modelName}Input.cs"), inputModel);
            WriteFile(Path.Combine(settings.ServiceOutDir, $"ViewModels/{modelName}.cs"), viewModel);

            WriteFile(Path.Combine(settings.ServiceOutDir, $"Repository/{modelName}Repository.cs"), RepoGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Repository/I{modelName}Repository.cs"), RepoInterfaceGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Repository/{modelName}RepoConfig.cs"), RepoConfigGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Controllers/{modelName}sController.cs"), ControllerGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Mappings/{modelName}Mapper.cs"), MappingGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"Database/AppDbContext{modelName}.cs"), AppDbContextGenerator.Get(settings.ServiceNamespace, modelName));
            WriteFile(Path.Combine(settings.ServiceOutDir, $"ViewModels/{modelName}Collection.cs"), ModelCollectionGenerator.Get(settings.ServiceNamespace, modelName));

            Console.WriteLine(CrudCshtmlInjectorGenerator.Get(modelName));
            Console.WriteLine(CrudInjectorGenerator.Get(modelName));
            Console.WriteLine(CrudUiTypescriptGenerator.Get(modelName));
            Console.WriteLine(UiControllerGenerator.Get(settings.UiNamespace, "Home", modelName));

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