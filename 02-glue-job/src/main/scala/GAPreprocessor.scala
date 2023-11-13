import com.amazonaws.services.glue.GlueContext
import com.amazonaws.services.glue.util.{GlueArgParser}
import org.apache.spark.sql.types.StructType
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.sql.{DataFrame, Row, SparkSession, SaveMode,AnalysisException}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

object GAPreprocessor {
  def main(sysArgs: Array[String]): Unit = {
    print("GAPreprocessor Starts...");
    val spark: SparkContext = if(!sysArgs.exists(_.contains("JOB_RUN_ID"))){
      val conf = new SparkConf()
        .set("fs.s3a.aws.credentials.provider", "org.apache.hadoop.fs.s3a.TemporaryAWSCredentialsProvider")
        .setAppName("myApp")
        .setMaster("local[*]")
      SparkContext.getOrCreate(conf)
    } else SparkContext.getOrCreate()

    spark.hadoopConfiguration.set("fs.s3a.server-side-encryption-algorithm", "AES256")
    spark.hadoopConfiguration.set("spark.sql.files.ignoreMissingFiles", "true")
    val glueContext: GlueContext = new GlueContext(spark)
    val sparkSession: SparkSession = glueContext.getSparkSession
    println(sysArgs.mkString("|"))
    val args: Map[String, String] = GlueArgParser.getResolvedOptions(sysArgs, Seq("JOB_NAME","PARTITION_PATH" ,"PREVIOUSDAY_PARTITION_PATH","GA_PREPROCESS_DATABUCKET","GA_S3BUCKET","DAY","MONTH","YEAR").toArray)

    val sourceGAData = s"s3a://${args("GA_S3BUCKET")}/clean/google_analytics/v1/year=${args("YEAR")}/month=${args("MONTH")}/day=${args("DAY")}/"
    val preProceesedGAEdges = getPreProcessedDf(sparkSession,args("GA_PREPROCESS_DATABUCKET"),args("PREVIOUSDAY_PARTITION_PATH"))
    val gaIDEdges = sparkSession.read.parquet(sourceGAData)
    val filteredDf = gaIDEdges.select(col("clientId"),explode(col("hits")).as("hit"))
                    .select(col("clientId"),explode(col("hit.customdimensions")).as("customdimension"))
                    .where("customdimension.index = 28")
                    .select(col("clientId"),explode(split(lower(col("customdimension.value")), "\\|")).as("tag")).where("tag is not null").dropDuplicates();
    
    val rolledupDf = preProceesedGAEdges.union(filteredDf).dropDuplicates()
    val s3Output = "s3a://"+args("GA_PREPROCESS_DATABUCKET")+"/"+args("PARTITION_PATH");
    rolledupDf.write.format("parquet")
    .mode(SaveMode.Overwrite)
    .save(s3Output);
    print("Completed");
  }

   def getPreProcessedDf(sparkSession:SparkSession, bucketName:String , pathName:String ): DataFrame = {
     //Need to check this, as when we run for first time handling the case, there could be impact if job fails and runs properly next day, needs to be removed ?
   var preProceesedGAEdges = sparkSession.createDataFrame(sparkSession.sparkContext.emptyRDD[Row],StructType(Array(StructField("clientid",StringType,true),StructField("tag",StringType,true))));
    try {
      preProceesedGAEdges = sparkSession.read.parquet("s3a://"+bucketName+"/"+pathName)
    }
    catch{
      case e: AnalysisException => println(e)
    }
    return preProceesedGAEdges;
  }

}