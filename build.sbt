val baseName = "orbit-gaid-search"
version := "0.1"

scalaVersion := "2.12.12"
val sparkVersion    = "2.4.6"
val jacksonV        = "2.6.7"
val amazonVersion   = "1.11.803"
val hadoopVersion   = "3.1.1"
lazy val root = (project in file("02-glue-job"))
  .settings(
    resolvers += "AWS Glue" at "https://aws-glue-etl-artifacts.s3.amazonaws.com/release/",
    name := s"${baseName}-glue-job",
    libraryDependencies ++= Seq (
      "com.amazonaws" % "AWSGlueETL" % "1.0.0",
      "org.apache.spark" %% "spark-yarn" % sparkVersion % "provided",
      "org.apache.spark" %% "spark-core" % sparkVersion % "provided",
      "org.apache.spark" %% "spark-sql" % sparkVersion % "provided",
      "org.apache.spark" %% "spark-avro" % sparkVersion % "provided",
      "org.apache.hadoop" % "hadoop-common" % hadoopVersion % "provided",
      "org.apache.hadoop" % "hadoop-aws" % hadoopVersion % "provided",
      "com.amazonaws" % "aws-java-sdk" % amazonVersion % "provided"
    ),
    dependencyOverrides ++= Seq(
      "com.fasterxml.jackson.core" % "jackson-core" % jacksonV % "provided",
      "com.fasterxml.jackson.core" % "jackson-databind" % jacksonV % "provided",
      "com.fasterxml.jackson.module" % "jackson-module-scala_2.11" % jacksonV % "provided"
    )
  )
