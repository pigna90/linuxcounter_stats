import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
from itertools import permutations

def fix_cpu(df):
	cpu_fixed = pd.read_csv('cpu_fixed.csv', skipinitialspace=True)

	for index, row in cpu_fixed.iterrows():
		df["cpu"] = df["cpu"].replace(row["a"],row["b"])

	return df

def hierarchical_json(df,attributes):
	level_1 = df[attributes[0]].unique()
	level_2 = df[attributes[1]].unique()
	level_3 = df[attributes[2]].unique()
	level_4 = df[attributes[3]].unique()
	
	data_dict = {}
	data_dict["name"] = "machine"
	data_dict["size"] = df.shape[0]
	data_dict["children"] = []
	data_dict["depth"] = 0
	
	for elem_1 in level_1:
		level_1_dict = {}
		level_1_dict["name"] = elem_1
		level_1_dict["children"] = []
		data_dict["children"].append(level_1_dict)
		
		level_1_df = df[df[attributes[0]] == elem_1]
		level_1_dict["size"] = level_1_df.shape[0]
		level_1_dict["depth"] = 1
		level_2 = level_1_df[attributes[1]].unique()
		for elem_2 in level_2:
			level_2_dict = {}
			level_2_dict["name"] = elem_2
			level_2_dict["children"] = []
			level_1_dict["children"].append(level_2_dict)
			
			level_2_df = level_1_df[level_1_df[attributes[1]] == elem_2]
			level_2_dict["size"] = level_2_df.shape[0]
			level_2_dict["depth"] = 2
			level_3 = level_2_df[attributes[2]].unique()
			for elem_3 in level_3:
				level_3_dict = {}
				level_3_dict["name"] = elem_3
				level_3_dict["children"] = []
				level_2_dict["children"].append(level_3_dict)

				level_3_df = level_2_df[level_2_df[attributes[2]] == elem_3]
				level_3_dict["size"] = level_3_df.shape[0]
				level_3_dict["depth"] = 3
				level_4 = level_3_df[attributes[3]].unique()
				for elem_4 in level_4:
					level_4_dict = {}
					level_4_dict["name"] = elem_4

					level_4_df = level_3_df[level_3_df[attributes[3]] == elem_4]
					level_4_dict["size"] = level_4_df.shape[0]
					level_4_dict["depth"] = 4

					if(level_4_df.shape[0] != 0):
						level_3_dict["children"].append(level_4_dict)

	return data_dict
	
def main():
	# Dataset linux counter
	df = pd.read_csv('lico.csv', skipinitialspace=True, delimiter=";")

	# Elimino attributi non necessari
	df = df.drop("diskSpace",1)
	df = df.drop("swap",1)
	df = df.drop("memory",1)
	df = df.drop("distroVersion",1)
	df = df.drop("userId",1)
	df = df.drop("kernel",1)
	df = df.drop("cpu",1)
	df = df.drop("country",1)
		
	# Sostituisco valori nulli e \N con "unknown"
	df = df.replace("\\N","unknown")
	df = df.fillna("unknown")

	df = df[df["numCores"] != "0"]
	
	for a in df:
		df = df[df[a] != "unknown"]

	attributes = list(map(list,permutations(list(df.columns.values))))

	for a in attributes:
		data_out = hierarchical_json(df,a)
		
		with open('./json/' + '_'.join(a) + '.json', 'w') as outfile:
			json.dump(data_out, outfile, ensure_ascii=False)
	
if __name__ == "__main__":
	main()
